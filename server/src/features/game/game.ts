import { WebSocket } from 'ws';
import { pool } from '../../core/db/pool';
import type { GamePhase, HostState, PlayerState, ServerMessage } from './game.types';
import type { Quiz, RevealMode } from '../quiz/quiz.types';
import { randomToken } from '../auth/auth.service';
import { HttpError } from '../../core/httpError';
import { closeRun } from '../quiz/quiz.service';
import { computePoints, computeRanks } from './scoring';
import { games } from './game.registry';

const FINISHED_GAME_TTL_MS = 30 * 60 * 1000;

export interface GamePlayer {
	id: number;
	token: string;
	nickname: string;
	avatar: string;
	score: number;
	ws: WebSocket | null;
	answers: Map<number, { index: number; points: number }>;
}

export const send = (ws: WebSocket | null, message: ServerMessage): void => {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	}
};

export class Game {
	host: WebSocket | null = null;
	players = new Map<number, GamePlayer>();
	phase: GamePhase = 'lobby';
	paused = false;
	// Live copy: the host can change it mid-game without touching the (frozen) quiz.
	revealMode: RevealMode;
	countdownSeconds: number;
	private index = -1;
	private countdownEndsAt = 0;
	private pausedRemainingMs = 0;
	private cancelled = new Set<number>();
	// Game DB writes run one after another, so a later write (cancel, results) never overtakes an answer.
	private writes: Promise<void> = Promise.resolve();
	private questionStartedAt = 0;
	private timer: NodeJS.Timeout | null = null;

	constructor(readonly quiz: Quiz, readonly runId: number) {
		this.revealMode = quiz.revealMode;
		this.countdownSeconds = quiz.countdown;
	}

	private get question() {
		return this.quiz.questions[this.index];
	}

	attachHost(ws: WebSocket): void {
		if (this.host && this.host !== ws) {
			this.host.close();
		}
		this.host = ws;
		this.broadcast();
	}

	async addPlayer(ws: WebSocket, nickname: string, avatar: string, userId: number | null): Promise<GamePlayer> {
		if (this.phase === 'end') {
			throw new HttpError(409, 'This game is over');
		}
		const token = randomToken();
		const { rows } = await pool.query<{ id: number }>(
			'INSERT INTO players (run_id, user_id, token, nickname, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING id',
			[
				this.runId,
				userId,
				token,
				nickname,
				avatar,
			],
		);
		const player: GamePlayer = {
			id: rows[0].id, token, nickname, avatar, score: 0, ws, answers: new Map(),
		};
		this.players.set(player.id, player);
		this.broadcast();

		return player;
	}

	attachPlayer(player: GamePlayer, ws: WebSocket): void {
		if (player.ws && player.ws !== ws) {
			player.ws.close();
		}
		player.ws = ws;
		this.broadcast();
	}

	disconnect(ws: WebSocket): void {
		if (this.host === ws) {
			this.host = null;
			this.broadcast();

			return;
		}
		const player = [...this.players.values()].find((candidate) => candidate.ws === ws);
		if (player) {
			player.ws = null;
			this.closeQuestionIfAllAnswered();
			this.broadcast();
		}
	}

	// Pausing freezes the running clock (countdown or question); resuming shifts it so answer times (and points) stay fair.
	setPaused(paused: boolean): void {
		// Nothing to pause before the start (lobby) or after the end.
		if (this.paused === paused || (paused && this.phase === 'lobby') || this.phase === 'end') {
			return;
		}
		if (paused && this.phase === 'countdown') {
			this.pausedRemainingMs = Math.max(0, this.countdownEndsAt - Date.now());
			this.clearTimer();
		}
		if (paused && this.phase === 'question') {
			this.pausedRemainingMs = this.remainingMs();
			this.clearTimer();
		}
		this.paused = paused;
		if (!paused && this.phase === 'countdown') {
			this.countdownEndsAt = Date.now() + this.pausedRemainingMs;
			this.timer = setTimeout(() => this.startQuestion(), this.pausedRemainingMs);
		}
		if (!paused && this.phase === 'question') {
			this.questionStartedAt = Date.now() - (this.question.timeLimit * 1000 - this.pausedRemainingMs);
			this.timer = setTimeout(() => this.closeQuestion(), this.pausedRemainingMs);
			if (this.closeQuestionIfAllAnswered()) {
				return;
			}
		}
		this.broadcast();
	}

	next(): void {
		if (this.paused || this.phase === 'countdown' || this.phase === 'question' || this.phase === 'end') {
			return;
		}
		if (this.phase === 'lobby' && this.players.size === 0) {
			throw new HttpError(409, 'Wait for at least one player');
		}
		if (this.index + 1 >= this.quiz.questions.length) {
			void this.finish();

			return;
		}
		this.index++;
		if (this.countdownSeconds > 0) {
			this.phase = 'countdown';
			this.countdownEndsAt = Date.now() + this.countdownSeconds * 1000;
			this.timer = setTimeout(() => this.startQuestion(), this.countdownSeconds * 1000);
			this.broadcast();

			return;
		}
		this.startQuestion();
	}

	private startQuestion(): void {
		this.clearTimer();
		this.phase = 'question';
		this.questionStartedAt = Date.now();
		this.timer = setTimeout(() => this.closeQuestion(), this.question.timeLimit * 1000);
		this.broadcast();
	}

	answer(player: GamePlayer, index: unknown): void {
		if (!this.players.has(player.id) || this.paused || this.phase !== 'question' || player.answers.has(this.index)) {
			return;
		}
		const answer = Number.isInteger(index) ? this.question.answers[index as number] : undefined;
		if (!answer) {
			return;
		}
		const points = answer.isCorrect
			? computePoints(this.question.difficulty, Date.now() - this.questionStartedAt, this.question.timeLimit)
			: 0;
		player.answers.set(this.index, { index: index as number, points });
		player.score += points;
		this.persist(
			'save answer',
			`WITH saved AS (
				INSERT INTO player_answers (player_id, question_id, answer_id, time_ms, points) VALUES ($1, $2, $3, $4, $5)
			)
			UPDATE players SET score = score + $5 WHERE id = $1`,
			[
				player.id,
				this.question.id,
				answer.id,
				Date.now() - this.questionStartedAt,
				points,
			],
		);
		if (!this.closeQuestionIfAllAnswered()) {
			this.sendHost();
			this.sendPlayer(player);
		}
	}

	// Host decision after a question (bad wording, wrong answer key…): nobody keeps points for it. Answers stay for the stats.
	cancelQuestion(): void {
		if (this.phase !== 'reveal' || this.cancelled.has(this.index)) {
			return;
		}
		this.cancelled.add(this.index);
		for (const player of this.players.values()) {
			const answer = player.answers.get(this.index);
			if (answer?.points) {
				player.score -= answer.points;
				answer.points = 0;
			}
		}
		this.persist(
			'cancel question',
			`WITH old AS (
				SELECT pa.player_id, pa.points FROM player_answers pa JOIN players p ON p.id = pa.player_id
				WHERE p.run_id = $1 AND pa.question_id = $2 AND pa.points > 0
			), zeroed AS (
				UPDATE player_answers pa SET points = 0 FROM old WHERE pa.player_id = old.player_id AND pa.question_id = $2
			)
			UPDATE players p SET score = p.score - old.points FROM old WHERE p.id = old.player_id`,
			[this.runId, this.question.id],
		);
		this.broadcast();
	}

	// Players can fix their nickname/avatar until the host starts; afterwards the ranking would shift under the host's eyes.
	updateProfile(player: GamePlayer, nickname: string, avatar: string): void {
		if (this.phase !== 'lobby') {
			throw new HttpError(409, 'The game has started, your profile can no longer be changed');
		}
		if (!this.players.has(player.id)) {
			return;
		}
		player.nickname = nickname;
		player.avatar = avatar;
		this.persist('update profile', 'UPDATE players SET nickname = $2, avatar = $3 WHERE id = $1', [player.id, nickname, avatar]);
		this.broadcast();
	}

	// Removes a player for good from this game: their row and answers go too, so they leave no trace in the results.
	// They are told first, then disconnected (their client stops reconnecting on `kicked`).
	kick(playerId: number): void {
		const player = this.players.get(playerId);
		if (!player || this.phase === 'end') {
			return;
		}
		this.players.delete(playerId);
		send(player.ws, { type: 'kicked' });
		player.ws?.close();
		this.persist(
			'kick player',
			`WITH answers AS (DELETE FROM player_answers WHERE player_id = $1)
			DELETE FROM players WHERE id = $1`,
			[playerId],
		);
		if (!this.closeQuestionIfAllAnswered()) {
			this.broadcast();
		}
	}

	setCode(code: string): void {
		this.quiz.code = code;
		this.broadcast();
	}

	setSettings(revealMode: RevealMode, countdownSeconds: number): void {
		this.revealMode = revealMode;
		this.countdownSeconds = countdownSeconds;
		this.broadcast();
	}

	private countdownState(): { index: number; remainingMs: number } | null {
		if (this.phase !== 'countdown') {
			return null;
		}

		return { index: this.index, remainingMs: this.paused ? this.pausedRemainingMs : Math.max(0, this.countdownEndsAt - Date.now()) };
	}

	// Ends the game for everyone right now, keeping the scores earned so far (with ranks) in the database.
	async stop(): Promise<void> {
		this.clearTimer();
		this.phase = 'end';
		await this.saveResults();
		this.abort();
		if (games.get(this.quiz.id) === this) {
			games.delete(this.quiz.id);
		}
	}

	abort(): void {
		this.clearTimer();
		send(this.host, { type: 'closed' });
		this.players.forEach((player) => send(player.ws, { type: 'closed' }));
	}

	private closeQuestionIfAllAnswered(): boolean {
		const connected = [...this.players.values()].filter((player) => player.ws);
		if (!this.paused && this.phase === 'question' && connected.every((player) => player.answers.has(this.index))) {
			this.closeQuestion();

			return true;
		}

		return false;
	}

	private closeQuestion(): void {
		this.clearTimer();
		this.phase = 'reveal';
		this.broadcast();
	}

	private async finish(): Promise<void> {
		this.phase = 'end';
		this.broadcast();
		await this.saveResults();
		setTimeout(() => {
			if (games.get(this.quiz.id) === this) {
				games.delete(this.quiz.id);
			}
		}, FINISHED_GAME_TTL_MS).unref();
	}

	private persist(label: string, sql: string, params: unknown[]): void {
		this.writes = this.writes
			.then(async () => {
				await pool.query(sql, params);
			})
			.catch((error) => console.error(`Failed to ${label}`, error));
	}

	private async saveResults(): Promise<void> {
		await this.writes;
		const ranks = this.ranks();
		try {
			await pool.query(
				'UPDATE players p SET rank = r.rank FROM unnest($1::int[], $2::int[]) AS r(id, rank) WHERE p.id = r.id',
				[[...ranks.keys()], [...ranks.values()]],
			);
			await closeRun(this.quiz.id);
			this.quiz.code = null;
		} catch (error) {
			console.error('Failed to save game results', error);
		}
	}

	private clearTimer(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	private ranks(): Map<number, number> {
		const players = [...this.players.values()];
		const ranks = computeRanks(players.map((player) => player.score));

		return new Map(players.map((player, i) => [player.id, ranks[i]]));
	}

	private remainingMs(): number {
		if (this.paused) {
			return this.pausedRemainingMs;
		}

		return Math.max(0, this.questionStartedAt + this.question.timeLimit * 1000 - Date.now());
	}

	private inQuestion(): boolean {
		return this.phase === 'question' || this.phase === 'reveal';
	}

	private hostState(): HostState {
		const ranks = this.ranks();
		const question = this.inQuestion() ? this.question : null;

		return {
			phase: this.phase,
			paused: this.paused,
			code: this.quiz.code,
			title: this.quiz.title,
			revealMode: this.revealMode,
			countdownSeconds: this.countdownSeconds,
			countdown: this.countdownState(),
			questionsCount: this.quiz.questions.length,
			players: [...this.players.values()]
				.map((player) => ({
					id: player.id,
					nickname: player.nickname,
					avatar: player.avatar,
					score: player.score,
					rank: ranks.get(player.id)!,
					connected: Boolean(player.ws),
					answered: player.answers.has(this.index),
				}))
				.sort((a, b) => a.rank - b.rank),
			question: question && {
				index: this.index,
				text: question.text,
				timeLimit: question.timeLimit,
				difficulty: question.difficulty,
				answers: question.answers.map((answer) => answer.text),
				remainingMs: this.remainingMs(),
				cancelled: this.cancelled.has(this.index),
			},
			reveal: question && this.phase === 'reveal'
				? {
					correct: question.answers.flatMap((answer, i) => (answer.isCorrect ? [i] : [])),
					counts: question.answers.map((_, i) => [...this.players.values()].filter((p) => p.answers.get(this.index)?.index === i).length),
				}
				: null,
		};
	}

	private playerState(player: GamePlayer): PlayerState {
		const showScores = this.revealMode === 'question' || this.phase === 'end';
		const question = this.inQuestion() ? this.question : null;
		const myAnswer = question ? player.answers.get(this.index) : undefined;

		return {
			phase: this.phase,
			paused: this.paused,
			code: this.quiz.code,
			title: this.quiz.title,
			questionsCount: this.quiz.questions.length,
			countdown: this.countdownState(),
			playersCount: this.players.size,
			hostConnected: Boolean(this.host),
			playerToken: player.token,
			me: {
				nickname: player.nickname,
				avatar: player.avatar,
				score: showScores ? player.score : null,
				rank: showScores ? this.ranks().get(player.id)! : null,
			},
			question: question && {
				index: this.index,
				answersCount: question.answers.length,
				timeLimit: question.timeLimit,
				remainingMs: this.remainingMs(),
				cancelled: this.cancelled.has(this.index),
			},
			myAnswer: myAnswer?.index ?? null,
			ahead: showScores ? this.aheadOf(player) : null,
			result: question && this.phase === 'reveal' && this.revealMode === 'question'
				? { correct: Boolean(myAnswer && question.answers[myAnswer.index].isCorrect), points: myAnswer?.points ?? 0 }
				: null,
		};
	}

	// O(n) per player, so O(n²) per broadcast; fine for classroom-sized rooms.
	private aheadOf(player: GamePlayer): PlayerState['ahead'] {
		let closest: GamePlayer | null = null;
		for (const other of this.players.values()) {
			if (other.score > player.score && (!closest || other.score < closest.score)) {
				closest = other;
			}
		}

		return closest && { nickname: closest.nickname, avatar: closest.avatar, gap: closest.score - player.score };
	}

	private sendHost(): void {
		send(this.host, { type: 'host-state', state: this.hostState() });
	}

	private sendPlayer(player: GamePlayer): void {
		send(player.ws, { type: 'player-state', state: this.playerState(player) });
	}

	// Full snapshots on every change, switch to diffs if rooms grow past a few hundred players.
	private broadcast(): void {
		this.sendHost();
		this.players.forEach((player) => this.sendPlayer(player));
	}
}
