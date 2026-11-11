import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientMessage } from './game.types';
import type { Quiz } from '../quiz/quiz.types';
import { verifyToken } from '../auth/auth.service';
import { assert, HttpError } from '../../core/httpError';
import { findQuizIdByCode, getOpenRunId, getQuiz, MAX_COUNTDOWN } from '../quiz/quiz.service';
import { cleanAvatar, cleanUsername } from '../user/user.service';
import { Game, send, type GamePlayer } from './game';
import { findPlayerByToken, games } from './game.registry';

interface Session {
	game: Game;
	player?: GamePlayer;
}

// Returns the live game of an open quiz, or a just-finished one so its results stay reachable.
const loadGame = async (quiz: Quiz): Promise<Game | null> => {
	const runId = await getOpenRunId(quiz.id);
	const current = games.get(quiz.id);
	if (current && (current.runId === runId || (!runId && current.phase === 'end'))) {
		return current;
	}
	if (!runId) {
		return null;
	}
	const game = new Game(quiz, runId);
	games.set(quiz.id, game);
	return game;
};

const handle = async (ws: WebSocket, message: ClientMessage, session: Session | null): Promise<Session | null> => {
	switch (message.type) {
		case 'host': {
			const userId = verifyToken(String(message.token));
			const quiz = Number.isInteger(message.quizId) ? await getQuiz(message.quizId) : null;
			assert(quiz && userId === quiz.ownerId, 'Quiz not found', 404);
			const game = await loadGame(quiz);
			assert(game, 'Open the quiz before hosting it', 409);
			game.attachHost(ws);
			return { game };
		}
		case 'join': {
			const code = String(message.code).toLowerCase();
			const quizId = /^[a-z0-9]{6}$/.test(code) ? await findQuizIdByCode(code) : null;
			const quiz = quizId ? await getQuiz(quizId) : null;
			const game = quiz ? await loadGame(quiz) : null;
			assert(game, 'No open quiz with this code', 404);
			const userId = message.token ? verifyToken(String(message.token)) : null;
			assert(userId !== game.quiz.ownerId, 'You cannot join your own quiz, host it instead', 403);
			const player = await game.addPlayer(ws, cleanUsername(message.nickname), cleanAvatar(message.avatar), userId);
			return { game, player };
		}
		case 'rejoin': {
			const found = findPlayerByToken(String(message.playerToken));
			assert(found, 'Your game session has expired', 410);
			found.game.attachPlayer(found.player, ws);
			return found;
		}
		case 'next': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			session.game.next();
			return session;
		}
		case 'pause': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			session.game.setPaused(message.paused === true);
			return session;
		}
		case 'settings': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			assert(message.revealMode === 'question' || message.revealMode === 'end', 'Invalid reveal mode');
			assert(Number.isInteger(message.countdown) && message.countdown >= 0 && message.countdown <= MAX_COUNTDOWN, 'Invalid countdown');
			session.game.setSettings(message.revealMode, message.countdown);
			return session;
		}
		case 'stop': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			await session.game.stop();
			return null;
		}
		case 'cancel-question': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			session.game.cancelQuestion();
			return session;
		}
		case 'profile': {
			assert(session?.player, 'Join the game first', 403);
			session.game.updateProfile(session.player, cleanUsername(message.nickname), cleanAvatar(message.avatar));
			return session;
		}
		case 'kick': {
			assert(session && !session.player && session.game.host === ws, 'Only the host can do that', 403);
			session.game.kick(Number(message.playerId));
			return session;
		}
		case 'answer': {
			if (session?.player) {
				session.game.answer(session.player, message.index);
			}
			return session;
		}
		default:
			return session;
	}
};

export const attachGameServer = (server: Server): void => {
	const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
	wss.on('connection', (ws) => {
		let session: Session | null = null;
		ws.on('message', async (raw) => {
			let message: ClientMessage;
			try {
				message = JSON.parse(raw.toString());
			} catch {
				return;
			}
			try {
				const next = await handle(ws, message, session);
				if (next && next.game !== session?.game) {
					session?.game.disconnect(ws);
				}
				session = next;
			} catch (error) {
				if (!(error instanceof HttpError)) {
					console.error(error);
				}
				send(ws, { type: 'error', message: error instanceof HttpError ? error.message : 'Something went wrong' });
			}
		});
		ws.on('close', () => {
			session?.game.disconnect(ws);
		});
	});
};
