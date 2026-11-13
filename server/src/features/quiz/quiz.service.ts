import { randomInt } from 'node:crypto';
import type pg from 'pg';
import { pool, withTransaction } from '../../core/db/pool';
import type { Answer, Question, Quiz, QuizInput, QuizSummary, Run, RunAnswer } from './quiz.types';
import { assert, HttpError, isUniqueViolation } from '../../core/httpError';
import { MAX_TITLE_LENGTH, uniqueTitle } from './title';
import { findUserById } from '../user/user.service';

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const MIN_ANSWERS = 2;
export const MAX_ANSWERS = 6;
export const MAX_COUNTDOWN = 10;
const DEFAULT_COUNTDOWN = 3;

const generateCode = (): string => {
	return Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
};

const isString = (value: unknown, max: number): value is string => {
	return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
};

const isIntBetween = (value: unknown, min: number, max: number): value is number => {
	return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
};

export const parseQuizInput = (body: unknown, maxQuestions: number): QuizInput => {
	const input = body as Partial<QuizInput> | null;
	assert(input && isString(input.title, MAX_TITLE_LENGTH), 'Title is required (max 100 characters)');
	assert(input.revealMode === 'question' || input.revealMode === 'end', 'Invalid reveal mode');
	// Missing in files exported before the setting existed: fall back to the default.
	const countdown = input.countdown ?? DEFAULT_COUNTDOWN;
	assert(isIntBetween(countdown, 0, MAX_COUNTDOWN), `Countdown must be 0 to ${MAX_COUNTDOWN} seconds`);
	assert(Array.isArray(input.questions) && input.questions.length >= 1 && input.questions.length <= maxQuestions, `A quiz needs 1 to ${maxQuestions} questions`);
	const questions = input.questions.map((question, index) => {
		const label = `Question ${index + 1}`;
		assert(question && isString(question.text, 300), `${label}: text is required (max 300 characters)`);
		assert(isIntBetween(question.timeLimit, 5, 120), `${label}: time limit must be 5 to 120 seconds`);
		assert(isIntBetween(question.difficulty, 1, 5), `${label}: difficulty must be 1 to 5`);
		assert(
			Array.isArray(question.answers) && question.answers.length >= MIN_ANSWERS && question.answers.length <= MAX_ANSWERS,
			`${label}: ${MIN_ANSWERS} to ${MAX_ANSWERS} answers required`,
		);
		question.answers.forEach((answer) => {
			assert(answer && isString(answer.text, 120), `${label}: every answer needs a text (max 120 characters)`);
		});
		assert(question.answers.some((answer) => answer.isCorrect === true), `${label}: at least one answer must be correct`);

		return {
			text: question.text.trim(),
			timeLimit: question.timeLimit,
			difficulty: question.difficulty,
			answers: question.answers.map((answer) => ({ text: answer.text.trim(), isCorrect: answer.isCorrect === true })),
		};
	});

	return {
		title: input.title.trim(), revealMode: input.revealMode, countdown, questions,
	};
};

const insertQuestions = async (client: pg.PoolClient, quizId: number, input: QuizInput): Promise<void> => {
	for (const [position, question] of input.questions.entries()) {
		const { rows } = await client.query<{ id: number }>(
			'INSERT INTO questions (quiz_id, position, text, time_limit, difficulty) VALUES ($1, $2, $3, $4, $5) RETURNING id',
			[
				quizId,
				position,
				question.text,
				question.timeLimit,
				question.difficulty,
			],
		);
		for (const [answerPosition, answer] of question.answers.entries()) {
			await client.query(
				'INSERT INTO answers (question_id, position, text, is_correct) VALUES ($1, $2, $3, $4)',
				[
					rows[0].id,
					answerPosition,
					answer.text,
					answer.isCorrect,
				],
			);
		}
	}
};

// Titles are made unique in app code, not by a constraint; two concurrent saves can still collide (cosmetic only).
const freeTitle = async (ownerId: number, title: string, excludeQuizId: number | null = null): Promise<string> => {
	const { rows } = await pool.query<{ title: string }>(
		'SELECT title FROM quizzes WHERE owner_id = $1 AND deleted_at IS NULL AND id IS DISTINCT FROM $2',
		[ownerId, excludeQuizId],
	);

	return uniqueTitle(title, rows.map((row) => row.title));
};

export const createQuiz = async (ownerId: number, input: QuizInput): Promise<number> => {
	// Count-then-insert can race past the limit by one on parallel requests; fine for a plan cap.
	const { rows: [{ count }] } = await pool.query<{ count: number }>('SELECT count(*)::int AS count FROM quizzes WHERE owner_id = $1', [ownerId]);
	assert(count < (await findUserById(ownerId))!.limits.maxQuizzes, 'Quiz limit reached for your plan');
	const title = await freeTitle(ownerId, input.title);

	return withTransaction(async (client) => {
		const { rows } = await client.query<{ id: number }>(
			'INSERT INTO quizzes (owner_id, title, reveal_mode, countdown) VALUES ($1, $2, $3, $4) RETURNING id',
			[
				ownerId,
				title,
				input.revealMode,
				input.countdown,
			],
		);
		await insertQuestions(client, rows[0].id, input);

		return rows[0].id;
	});
};

export const hasAnswers = async (quizId: number): Promise<boolean> => {
	const { rowCount } = await pool.query(
		'SELECT 1 FROM player_answers pa JOIN questions q ON q.id = pa.question_id WHERE q.quiz_id = $1 LIMIT 1',
		[quizId],
	);

	return Boolean(rowCount);
};

// Players keep their score and rank, but their per-question answers are dropped with the old questions.
export const updateQuiz = async (quiz: Quiz, input: QuizInput): Promise<void> => {
	const quizId = quiz.id;
	const title = await freeTitle(quiz.ownerId, input.title, quizId);
	// Check-then-update, an open racing the save is not blocked; lock the quiz row if that ever matters.
	assert(!(await getOpenRunId(quizId)), 'Close this quiz before editing it', 409);
	await withTransaction(async (client) => {
		await client.query('UPDATE quizzes SET title = $2, reveal_mode = $3, countdown = $4 WHERE id = $1', [
			quizId,
			title,
			input.revealMode,
			input.countdown,
		]);
		await client.query('DELETE FROM player_answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = $1)', [quizId]);
		await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
		await insertQuestions(client, quizId, input);
	});
};

export const getQuiz = async (quizId: number): Promise<Quiz | null> => {
	const { rows } = await pool.query<Omit<Quiz, 'questions'>>(
		'SELECT id, code, owner_id AS "ownerId", title, reveal_mode AS "revealMode", countdown FROM quizzes WHERE id = $1 AND deleted_at IS NULL',
		[quizId],
	);
	if (!rows[0]) {
		return null;
	}
	const questions = await pool.query<Omit<Question, 'answers'>>(
		`SELECT id, text, time_limit AS "timeLimit", difficulty FROM questions WHERE quiz_id = $1 ORDER BY position`,
		[quizId],
	);
	const answers = await pool.query<Answer & { questionId: number }>(
		`SELECT a.id, a.question_id AS "questionId", a.text, a.is_correct AS "isCorrect"
		FROM answers a JOIN questions q ON q.id = a.question_id
		WHERE q.quiz_id = $1 ORDER BY a.position`,
		[quizId],
	);

	return {
		...rows[0],
		questions: questions.rows.map((question) => ({
			...question,
			answers: answers.rows
				.filter((answer) => answer.questionId === question.id)
				.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
		})),
	};
};

export const listQuizzes = async (ownerId: number): Promise<QuizSummary[]> => {
	const { rows } = await pool.query<QuizSummary>(
		`SELECT q.id, q.code, q.title, q.created_at AS "createdAt",
			EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL) AS "isOpen",
			(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS "questionsCount",
			(SELECT count(*)::int FROM runs r WHERE r.quiz_id = q.id AND r.cleared_at IS NULL) AS "runsCount"
		FROM quizzes q
		WHERE q.owner_id = $1 AND q.deleted_at IS NULL
		ORDER BY q.created_at DESC`,
		[ownerId],
	);

	return rows;
};

export const duplicateQuiz = async (quiz: Quiz): Promise<number> => {
	return createQuiz(quiz.ownerId, {
		title: quiz.title,
		revealMode: quiz.revealMode,
		countdown: quiz.countdown,
		questions: quiz.questions,
	});
};

// Opening is what gives the quiz its join code.
export const openRun = async (quizId: number): Promise<void> => {
	try {
		await pool.query('INSERT INTO runs (quiz_id) VALUES ($1)', [quizId]);
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new HttpError(409, 'This quiz is already open');
		}

		throw error;
	}
	// Not in the insert's transaction (a unique violation would abort it); a crash between leaves an open quiz without code, closing it again fixes it.
	await assignNewCode(quizId);
};

export const getOpenRunId = async (quizId: number): Promise<number | null> => {
	const { rows } = await pool.query<{ id: number }>('SELECT id FROM runs WHERE quiz_id = $1 AND ended_at IS NULL', [quizId]);

	return rows[0]?.id ?? null;
};

// Gives the quiz a fresh code; the old code and its share links stop working.
export const assignNewCode = async (quizId: number): Promise<string> => {
	for (let attempt = 0; attempt < 10; attempt++) {
		try {
			const code = generateCode();
			await pool.query('UPDATE quizzes SET code = $2 WHERE id = $1', [quizId, code]);

			return code;
		} catch (error) {
			if (!isUniqueViolation(error)) {
				throw error;
			}
		}
	}

	throw new Error('Could not generate a free quiz code');
};

// Every session end (finished, stopped or closed) goes through here, and each one retires the code,
// so a code that circulated in one class can't be used to drop into the next session.
export const closeRun = async (quizId: number): Promise<void> => {
	await withTransaction(async (client) => {
		await client.query('UPDATE runs SET ended_at = now() WHERE quiz_id = $1 AND ended_at IS NULL', [quizId]);
		await client.query('UPDATE quizzes SET code = NULL WHERE id = $1', [quizId]);
	});
};

// Returns the closed quiz ids so the caller can abort their live games.
export const closeOwnerRuns = async (ownerId: number): Promise<number[]> => {
	const { rows } = await pool.query<{ quizId: number }>(
		`SELECT DISTINCT r.quiz_id AS "quizId" FROM runs r JOIN quizzes q ON q.id = r.quiz_id
		WHERE q.owner_id = $1 AND r.ended_at IS NULL`,
		[ownerId],
	);
	for (const { quizId } of rows) {
		await closeRun(quizId);
	}

	return rows.map((row) => row.quizId);
};

export const deleteQuiz = async (quizId: number): Promise<void> => {
	await withTransaction(async (client) => {
		await client.query('UPDATE runs SET ended_at = now() WHERE quiz_id = $1 AND ended_at IS NULL', [quizId]);
		await client.query('UPDATE quizzes SET deleted_at = now(), code = NULL WHERE id = $1', [quizId]);
	});
};

// Finished runs only: a running game keeps its stats. No runId = every run of the quiz.
export const clearStats = async (quizId: number, runId?: number): Promise<void> => {
	await pool.query(
		'UPDATE runs SET cleared_at = now() WHERE quiz_id = $1 AND ($2::int IS NULL OR id = $2) AND ended_at IS NOT NULL AND cleared_at IS NULL',
		[quizId, runId ?? null],
	);
};

export const listRuns = async (quizId: number): Promise<Run[]> => {
	const runs = await pool.query<Omit<Run, 'players'>>(
		'SELECT id, started_at AS "startedAt", ended_at AS "endedAt" FROM runs WHERE quiz_id = $1 AND cleared_at IS NULL ORDER BY started_at DESC',
		[quizId],
	);
	const players = await pool.query<Omit<Run['players'][number], 'answers'> & { runId: number }>(
		`SELECT p.id, p.run_id AS "runId", p.nickname, p.avatar, p.score, p.rank
		FROM players p JOIN runs r ON r.id = p.run_id
		WHERE r.quiz_id = $1 ORDER BY p.score DESC`,
		[quizId],
	);

	// Positions, not ids: the front matches them with the quiz it already loaded (editing a played quiz wipes its answers).
	const answers = await pool.query<RunAnswer & { playerId: number }>(
		`SELECT pa.player_id AS "playerId", qu.position AS question, a.position AS answer, pa.time_ms AS "timeMs", pa.points
		FROM player_answers pa
		JOIN questions qu ON qu.id = pa.question_id
		JOIN answers a ON a.id = pa.answer_id
		WHERE qu.quiz_id = $1`,
		[quizId],
	);

	return runs.rows.map((run) => ({
		...run,
		players: players.rows.filter((player) => player.runId === run.id).map(({ runId, ...player }) => ({
			...player,
			answers: answers.rows.filter((row) => row.playerId === player.id).map(({ playerId, ...row }) => row),
		})),
	}));
};

export const isPlayerInQuiz = async (playerId: number, quizId: number): Promise<boolean> => {
	const { rowCount } = await pool.query(
		'SELECT 1 FROM players p JOIN runs r ON r.id = p.run_id WHERE p.id = $1 AND r.quiz_id = $2 AND r.cleared_at IS NULL',
		[playerId, quizId],
	);

	return Boolean(rowCount);
};

export const findQuizIdByCode = async (code: string): Promise<number | null> => {
	const { rows } = await pool.query<{ id: number }>('SELECT id FROM quizzes WHERE code = $1 AND deleted_at IS NULL', [code]);

	return rows[0]?.id ?? null;
};
