import { pool } from '../../core/db/pool';
import { assert } from '../../core/httpError';
import { abortGame, games } from '../game/game.registry';
import { closeOwnerRuns, closeRun } from '../quiz/quiz.service';
import type { AdminLiveGame, AdminOverview, AdminQuiz, AdminUser, AdminUserDetail } from './admin.types';

// Lists are capped at 200 rows with a text search, add paging when that stops being enough.
const LIST_LIMIT = 200;

export const getOverview = async (): Promise<AdminOverview> => {
	const { rows } = await pool.query<Omit<AdminOverview, 'liveGames' | 'livePlayers' | 'activity'>>(
		`SELECT
			(SELECT count(*)::int FROM users) AS users,
			(SELECT count(*)::int FROM users WHERE created_at > now() - interval '7 days') AS "newUsers7d",
			(SELECT count(*)::int FROM quizzes WHERE deleted_at IS NULL) AS quizzes,
			(SELECT count(*)::int FROM runs WHERE ended_at IS NULL) AS "openQuizzes",
			(SELECT count(*)::int FROM runs r WHERE EXISTS (SELECT 1 FROM players p WHERE p.run_id = r.id)) AS "gamesPlayed",
			(SELECT count(*)::int FROM players) AS players`,
	);
	// Last 30 days, one row per day (empty days included) for the dashboard charts.
	const { rows: activity } = await pool.query<AdminOverview['activity'][number]>(
		`SELECT to_char(d, 'YYYY-MM-DD') AS day,
			(SELECT count(*)::int FROM users WHERE created_at >= d AND created_at < d + interval '1 day') AS users,
			(SELECT count(*)::int FROM players WHERE joined_at >= d AND joined_at < d + interval '1 day') AS players
		FROM generate_series(current_date - 29, current_date, interval '1 day') AS d`,
	);
	const live = [...games.values()];

	return {
		...rows[0], activity, liveGames: live.length, livePlayers: live.reduce((sum, game) => sum + game.players.size, 0),
	};
};

const ADMIN_USER_COLUMNS = `u.id, u.email, u.username, u.avatar, u.plan, u.is_admin AS "isAdmin",
	u.banned_at AS "bannedAt", u.created_at AS "createdAt",
	(SELECT count(*)::int FROM quizzes q WHERE q.owner_id = u.id AND q.deleted_at IS NULL) AS quizzes,
	(SELECT count(*)::int FROM players p WHERE p.user_id = u.id) AS "gamesPlayed"`;

export const listUsers = async (search: string): Promise<AdminUser[]> => {
	const { rows } = await pool.query<AdminUser>(
		`SELECT ${ADMIN_USER_COLUMNS}
		FROM users u
		WHERE $1 = '' OR u.username ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
		ORDER BY u.created_at DESC
		LIMIT ${LIST_LIMIT}`,
		[search],
	);

	return rows;
};

export const setAdmin = async (actorId: number, userId: number, isAdmin: boolean): Promise<void> => {
	assert(actorId !== userId, 'You cannot change your own admin access');
	const { rowCount } = await pool.query('UPDATE users SET is_admin = $2 WHERE id = $1', [userId, isAdmin]);
	assert(rowCount, 'Account not found', 404);
};

export const getUserDetail = async (userId: number): Promise<AdminUserDetail> => {
	const { rows } = await pool.query<AdminUserDetail>(
		`SELECT ${ADMIN_USER_COLUMNS}, u.ban_reason AS "banReason", u.password_hash IS NOT NULL AS "hasPassword",
			(SELECT coalesce(sum(score), 0)::int FROM players p WHERE p.user_id = u.id) AS "totalScore",
			ARRAY(SELECT provider FROM user_identities i WHERE i.user_id = u.id ORDER BY provider) AS providers,
			coalesce((SELECT json_agg(x ORDER BY x.deleted, x.id DESC) FROM (
				SELECT q.id, q.title, q.deleted_at IS NOT NULL AS deleted,
					(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS questions,
					EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL) AS "isOpen"
				FROM quizzes q WHERE q.owner_id = u.id
			) x), '[]') AS "quizList"
		FROM users u
		WHERE u.id = $1`,
		[userId],
	);
	assert(rows[0], 'Account not found', 404);

	return rows[0];
};

// A ban also ends the user's open quizzes, so nobody keeps playing a game they can no longer host.
export const banUser = async (actorId: number, userId: number, reason: string | null): Promise<void> => {
	assert(actorId !== userId, 'You cannot ban yourself');
	const { rowCount } = await pool.query('UPDATE users SET banned_at = now(), ban_reason = $2 WHERE id = $1', [userId, reason]);
	assert(rowCount, 'Account not found', 404);
	for (const quizId of await closeOwnerRuns(userId)) {
		abortGame(quizId);
	}
};

export const unbanUser = async (userId: number): Promise<void> => {
	const { rowCount } = await pool.query('UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = $1', [userId]);
	assert(rowCount, 'Account not found', 404);
};

export const listQuizzes = async (search: string): Promise<AdminQuiz[]> => {
	const { rows } = await pool.query<AdminQuiz>(
		`SELECT q.id, q.title, q.code, q.owner_id AS "ownerId", u.username AS owner, q.created_at AS "createdAt",
			q.deleted_at IS NOT NULL AS deleted,
			(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS questions,
			(SELECT count(*)::int FROM runs r WHERE r.quiz_id = q.id) AS runs,
			EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL) AS "isOpen"
		FROM quizzes q
		JOIN users u ON u.id = q.owner_id
		WHERE $1 = '' OR q.title ILIKE '%' || $1 || '%' OR q.code = lower($1) OR u.username ILIKE '%' || $1 || '%'
		ORDER BY q.created_at DESC
		LIMIT ${LIST_LIMIT}`,
		[search],
	);

	return rows;
};

export const listLiveGames = (): AdminLiveGame[] => {
	return [...games.entries()].map(([quizId, game]) => ({
		quizId,
		title: game.quiz.title,
		code: game.quiz.code,
		phase: game.phase,
		hostConnected: Boolean(game.host),
		players: game.players.size,
		connected: [...game.players.values()].filter((player) => player.ws).length,
	}));
};
