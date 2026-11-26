import { randomInt } from 'node:crypto';
import type pg from 'pg';
import { pool, withTransaction } from '../../core/db/pool';
import type { Answer, PublicProfile, PublicQuiz, QuizPreview, Question, Quiz, QuizInput, QuizSummary, Run, RunAnswer } from './quiz.types';
import { assert, HttpError, isUniqueViolation } from '../../core/httpError';
import { MAX_TITLE_LENGTH, uniqueTitle } from './title';
import { findUserById } from '../user/user.service';

const CODE_CHARS = '0123456789';
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

interface QuizSourceLink {
	id: number;
	syncedAt: string;
}

// Returns the new quiz uid.
export const createQuiz = async (ownerId: number, input: QuizInput, source: QuizSourceLink | null = null): Promise<string> => {
	// Count-then-insert can race past the limit by one on parallel requests; fine for a plan cap.
	const { rows: [{ count }] } = await pool.query<{ count: number }>('SELECT count(*)::int AS count FROM quizzes WHERE owner_id = $1 AND deleted_at IS NULL', [ownerId]);
	assert(count < (await findUserById(ownerId))!.limits.maxQuizzes, 'Quiz limit reached for your plan');
	const title = await freeTitle(ownerId, input.title);

	return withTransaction(async (client) => {
		const { rows } = await client.query<{ id: number; uid: string }>(
			'INSERT INTO quizzes (owner_id, title, reveal_mode, countdown, source_id, synced_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, uid',
			[
				ownerId,
				title,
				input.revealMode,
				input.countdown,
				source?.id ?? null,
				source?.syncedAt ?? null,
			],
		);
		await insertQuestions(client, rows[0].id, input);

		return rows[0].uid;
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
// syncedAt is set by a pull: the source version the copy now holds.
export const updateQuiz = async (quiz: Quiz, input: QuizInput, syncedAt: string | null = null): Promise<void> => {
	const quizId = quiz.id;
	const title = await freeTitle(quiz.ownerId, input.title, quizId);
	// Check-then-update, an open racing the save is not blocked; lock the quiz row if that ever matters.
	assert(!(await getOpenRunId(quizId)), 'Close this quiz before editing it', 409);
	await withTransaction(async (client) => {
		await client.query(
			'UPDATE quizzes SET title = $2, reveal_mode = $3, countdown = $4, updated_at = now(), synced_at = coalesce($5, synced_at) WHERE id = $1',
			[
				quizId,
				title,
				input.revealMode,
				input.countdown,
				syncedAt,
			],
		);
		await client.query('DELETE FROM player_answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = $1)', [quizId]);
		await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
		await insertQuestions(client, quizId, input);
	});
};

// includeDeleted: admin previews only; owners and players never see a deleted quiz.
export const getQuiz = async (quizId: number, includeDeleted = false): Promise<Quiz | null> => {
	const { rows } = await pool.query<Omit<Quiz, 'questions'>>(
		'SELECT id, uid, code, owner_id AS "ownerId", title, reveal_mode AS "revealMode", countdown FROM quizzes WHERE id = $1 AND ($2 OR deleted_at IS NULL)',
		[quizId, includeDeleted],
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

export const findQuizIdByUid = async (uid: unknown): Promise<number | null> => {
	if (typeof uid !== 'string') {
		return null;
	}
	const { rows } = await pool.query<{ id: number }>('SELECT id FROM quizzes WHERE uid = $1 AND deleted_at IS NULL', [uid]);

	return rows[0]?.id ?? null;
};

// A library quiz that can still be copied or pulled from (s = the quiz, su = its owner).
const SOURCE_AVAILABLE = `s.is_public AND s.deleted_at IS NULL AND s.moderation IS DISTINCT FROM 'banned'
	AND su.banned_at IS NULL AND su.deleted_at IS NULL`;

export const listQuizzes = async (ownerId: number): Promise<QuizSummary[]> => {
	const { rows } = await pool.query<QuizSummary>(
		`SELECT q.uid, q.code, q.title, q.created_at AS "createdAt", q.is_public AS "isPublic",
			q.moderation, q.moderation_reason AS "moderationReason",
			EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL) AS "isOpen",
			(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS "questionsCount",
			(SELECT count(*)::int FROM runs r WHERE r.quiz_id = q.id AND r.cleared_at IS NULL) AS "runsCount",
			CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
				'uid', s.uid,
				'title', s.title,
				'owner', su.username,
				'available', ${SOURCE_AVAILABLE},
				'updateAvailable', (${SOURCE_AVAILABLE}) AND s.updated_at > q.synced_at
			) END AS source
		FROM quizzes q
		LEFT JOIN quizzes s ON s.id = q.source_id
		LEFT JOIN users su ON su.id = s.owner_id
		WHERE q.owner_id = $1 AND q.deleted_at IS NULL
		ORDER BY q.created_at DESC`,
		[ownerId],
	);

	return rows;
};

// Search is a plain ILIKE on title and owner, capped like the admin lists; add paging when the library grows.
// viewerId (optional) only adds display hints: isOwn hides the report button, reported fills it.
// downloads = users who ever copied it: deleted copies still count, duplicates of a copy don't.
// ownerUid (optional) narrows it to one creator's public card.
export const listPublicQuizzes = async (search: string, viewerId: number | null, ownerUid: string | null = null): Promise<PublicQuiz[]> => {
	const { rows } = await pool.query<PublicQuiz>(
		`SELECT s.uid, s.title, su.username AS owner, su.uid AS "ownerUid", su.avatar AS "ownerAvatar", s.updated_at AS "updatedAt", s.moderation,
			(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = s.id) AS "questionsCount",
			(SELECT count(DISTINCT c.owner_id)::int FROM quizzes c WHERE c.source_id = s.id) AS downloads,
			coalesce(s.owner_id = $2::int, false) AS "isOwn",
			EXISTS (SELECT 1 FROM quiz_reports r WHERE r.quiz_id = s.id AND r.reporter_id = $2::int AND r.resolved_at IS NULL) AS reported
		FROM quizzes s
		JOIN users su ON su.id = s.owner_id
		WHERE ${SOURCE_AVAILABLE} AND ($1 = '' OR s.title ILIKE '%' || $1 || '%' OR su.username ILIKE '%' || $1 || '%')
			AND ($3::text IS NULL OR su.uid = $3)
		ORDER BY s.updated_at DESC
		LIMIT 200`,
		[search, viewerId, ownerUid],
	);

	return rows;
};

// 404 unless the user has a library quiz: a profile only exists through what its owner chose to publish.
export const getPublicProfile = async (uid: string, viewerId: number | null): Promise<PublicProfile> => {
	const quizzes = await listPublicQuizzes('', viewerId, uid);
	assert(quizzes.length, 'Profile not found', 404);
	const { rows } = await pool.query<{ createdAt: string }>('SELECT created_at AS "createdAt" FROM users WHERE uid = $1', [uid]);

	return {
		uid,
		username: quizzes[0].owner,
		avatar: quizzes[0].ownerAvatar,
		createdAt: rows[0].createdAt,
		quizzes,
	};
};

// The library quiz behind a uid (copy) or a copy's source_id (pull), with the version it is at.
const findSource = async (where: 'uid' | 'id', value: string | number): Promise<{ quiz: Quiz; updatedAt: string } | null> => {
	// ::text keeps the microseconds a JS Date would drop, so synced_at compares equal to updated_at.
	const { rows } = await pool.query<{ id: number; updatedAt: string }>(
		`SELECT s.id, s.updated_at::text AS "updatedAt" FROM quizzes s JOIN users su ON su.id = s.owner_id
		WHERE s.${where} = $1 AND ${SOURCE_AVAILABLE}`,
		[value],
	);
	const quiz = rows[0] ? await getQuiz(rows[0].id) : null;

	return quiz ? { quiz, updatedAt: rows[0].updatedAt } : null;
};

export const toPreview = async (quiz: Quiz, withCorrect: boolean): Promise<QuizPreview> => {
	const { rows } = await pool.query<{ owner: string }>('SELECT username AS owner FROM users WHERE id = $1', [quiz.ownerId]);

	return {
		uid: quiz.uid,
		title: quiz.title,
		owner: rows[0].owner,
		questions: quiz.questions.map(({
			text, timeLimit, difficulty, answers,
		}) => ({
			text,
			timeLimit,
			difficulty,
			answers: answers.map((answer) => answer.text),
			...(withCorrect && { correct: answers.flatMap((answer, index) => (answer.isCorrect ? [index] : [])) }),
		})),
	};
};

export const previewPublicQuiz = async (uid: string): Promise<QuizPreview> => {
	const source = await findSource('uid', uid);
	assert(source, 'Quiz not found', 404);

	return toPreview(source.quiz, false);
};

const toInput = (quiz: Quiz): QuizInput => ({
	title: quiz.title,
	revealMode: quiz.revealMode,
	countdown: quiz.countdown,
	questions: quiz.questions,
});

// A second open report from the same user is a no-op (409 would only tell them what they already know).
export const reportPublicQuiz = async (userId: number, uid: string, reason: string): Promise<void> => {
	const source = await findSource('uid', uid);
	assert(source, 'Quiz not found', 404);
	assert(source.quiz.ownerId !== userId, 'You cannot report your own quiz', 403);
	await pool.query(
		`INSERT INTO quiz_reports (quiz_id, reporter_id, reason) VALUES ($1, $2, $3)
		ON CONFLICT (quiz_id, reporter_id) WHERE resolved_at IS NULL DO NOTHING`,
		[source.quiz.id, userId, reason],
	);
};

// GDPR export: the reports a user filed.
export const listOwnReports = async (userId: number): Promise<{ quiz: string; reason: string; createdAt: string }[]> => {
	const { rows } = await pool.query<{ quiz: string; reason: string; createdAt: string }>(
		`SELECT q.title AS quiz, r.reason, r.created_at AS "createdAt"
		FROM quiz_reports r JOIN quizzes q ON q.id = r.quiz_id WHERE r.reporter_id = $1 ORDER BY r.created_at`,
		[userId],
	);

	return rows;
};

export const copyPublicQuiz = async (userId: number, uid: string): Promise<string> => {
	const source = await findSource('uid', uid);
	assert(source, 'Quiz not found', 404);

	return createQuiz(userId, toInput(source.quiz), { id: source.quiz.id, syncedAt: source.updatedAt });
};

// Same rules as an owner edit (closed quiz only, per-question stats dropped): it is one.
export const pullSource = async (quiz: Quiz): Promise<void> => {
	const { rows } = await pool.query<{ sourceId: number | null }>('SELECT source_id AS "sourceId" FROM quizzes WHERE id = $1', [quiz.id]);
	assert(rows[0].sourceId, 'This quiz is not a copy');
	const source = await findSource('id', rows[0].sourceId);
	assert(source, 'The original quiz is no longer public', 409);
	await updateQuiz(quiz, toInput(source.quiz), source.updatedAt);
};

export const setPublic = async (quizId: number, isPublic: boolean): Promise<void> => {
	if (isPublic) {
		const { rows } = await pool.query<{ isCopy: boolean; banned: boolean }>(
			`SELECT source_id IS NOT NULL AS "isCopy", moderation = 'banned' AS banned FROM quizzes WHERE id = $1`,
			[quizId],
		);
		assert(!rows[0].banned, 'This quiz was banned by a moderator', 403);
		assert(!rows[0].isCopy, 'A copy of a library quiz cannot be published', 409);
	}
	await pool.query('UPDATE quizzes SET is_public = $2 WHERE id = $1', [quizId, isPublic]);
};

// A duplicated copy stays a copy, so it can still pull and can't be republished as someone's own.
export const duplicateQuiz = async (quiz: Quiz): Promise<string> => {
	const { rows } = await pool.query<{ id: number | null; syncedAt: string }>('SELECT source_id AS id, synced_at::text AS "syncedAt" FROM quizzes WHERE id = $1', [quiz.id]);

	return createQuiz(quiz.ownerId, toInput(quiz), rows[0].id ? { id: rows[0].id, syncedAt: rows[0].syncedAt } : null);
};

// Opening is what gives the quiz its join code.
export const openRun = async (quizId: number): Promise<void> => {
	const { rowCount } = await pool.query(`SELECT 1 FROM quizzes WHERE id = $1 AND moderation = 'banned'`, [quizId]);
	assert(!rowCount, 'This quiz was banned by a moderator', 403);
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
