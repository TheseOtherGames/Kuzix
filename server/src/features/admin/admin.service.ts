import { pool } from '../../core/db/pool';
import { assert, HttpError, isUniqueViolation } from '../../core/httpError';
import { abortGame, games } from '../game/game.registry';
import { closeOwnerRuns, closeRun } from '../quiz/quiz.service';
import type { AdminLiveGame, AdminOverview, AdminQuiz, AdminReport, AdminRole, AdminUser, AdminUserDetail } from './admin.types';
import type { Moderation } from '../quiz/quiz.types';
import type { UserRole } from '../user/user.types';
import { ADMIN_COLUMNS, ADMIN_SECTIONS, LIMIT_COLUMNS, readRole, roleColumns, type RoleRow } from '../user/roles';
import type { PlanLimits } from '../user/user.types';

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
			(SELECT count(*)::int FROM players) AS players,
			(SELECT count(*)::int FROM quiz_reports WHERE resolved_at IS NULL) AS "openReports"`,
	);
	// Last 30 days, one row per day (empty days included) for the dashboard charts.
	const { rows: activity } = await pool.query<AdminOverview['activity'][number]>(
		`SELECT to_char(d, 'YYYY-MM-DD') AS day,
			(SELECT count(*)::int FROM users WHERE created_at >= d AND created_at < d + interval '1 day') AS users,
			(SELECT count(*)::int FROM players WHERE joined_at >= d AND joined_at < d + interval '1 day') AS players,
			(SELECT count(*)::int FROM quizzes WHERE source_id IS NULL AND created_at >= d AND created_at < d + interval '1 day') AS quizzes,
			(SELECT count(*)::int FROM runs r WHERE started_at >= d AND started_at < d + interval '1 day'
				AND EXISTS (SELECT 1 FROM players p WHERE p.run_id = r.id)) AS games,
			(SELECT count(*)::int FROM quizzes WHERE source_id IS NOT NULL AND created_at >= d AND created_at < d + interval '1 day') AS copies,
			(SELECT count(*)::int FROM quiz_reports WHERE created_at >= d AND created_at < d + interval '1 day') AS reports
		FROM generate_series(current_date - 29, current_date, interval '1 day') AS d`,
	);
	const live = [...games.values()];

	return {
		...rows[0], activity, liveGames: live.length, livePlayers: live.reduce((sum, game) => sum + game.players.size, 0),
	};
};

const ADMIN_USER_COLUMNS = `u.id, u.email, u.username, u.avatar, u.plan, u.is_admin AS "isAdmin",
	u.role_id AS "roleId", ${roleColumns('u.role_id')},
	u.banned_at AS "bannedAt", u.created_at AS "createdAt",
	(SELECT count(*)::int FROM quizzes q WHERE q.owner_id = u.id AND q.deleted_at IS NULL) AS quizzes,
	(SELECT count(*)::int FROM players p WHERE p.user_id = u.id) AS "gamesPlayed"`;

export const listUsers = async (search: string): Promise<AdminUser[]> => {
	const { rows } = await pool.query<Omit<AdminUser, 'role'> & RoleRow>(
		`SELECT ${ADMIN_USER_COLUMNS}
		FROM users u
		WHERE $1 = '' OR u.username ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
		ORDER BY u.created_at DESC
		LIMIT ${LIST_LIMIT}`,
		[search],
	);

	return rows.map(readRole);
};

export const setAdmin = async (actorId: number, userId: number, isAdmin: boolean): Promise<void> => {
	assert(actorId !== userId, 'You cannot change your own admin access');
	const { rowCount } = await pool.query('UPDATE users SET is_admin = $2 WHERE id = $1', [userId, isAdmin]);
	assert(rowCount, 'Account not found', 404);
};

export const getUserDetail = async (userId: number): Promise<AdminUserDetail> => {
	const { rows } = await pool.query<Omit<AdminUserDetail, 'role'> & RoleRow>(
		`SELECT ${ADMIN_USER_COLUMNS}, u.ban_reason AS "banReason", u.password_hash IS NOT NULL AS "hasPassword",
			(SELECT coalesce(sum(score), 0)::int FROM players p WHERE p.user_id = u.id) AS "totalScore",
			ARRAY(SELECT provider FROM user_identities i WHERE i.user_id = u.id ORDER BY provider) AS providers,
			coalesce((SELECT json_agg(x ORDER BY x.deleted, x.id DESC) FROM (
				SELECT q.id, q.title, q.deleted_at IS NOT NULL AS deleted,
					(SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS questions,
					EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL) AS "isOpen"
				FROM quizzes q WHERE q.owner_id = u.id
			) x), '[]') AS "quizList",
			coalesce((SELECT json_agg(n ORDER BY n."createdAt" DESC) FROM (
				SELECT un.id, un.kind, un.quiz_id AS "quizId", q.title AS "quizTitle", un.reason, a.username AS admin, un.created_at AS "createdAt"
				FROM user_notes un JOIN quizzes q ON q.id = un.quiz_id JOIN users a ON a.id = un.admin_id
				WHERE un.user_id = u.id
			) n), '[]') AS notes
		FROM users u
		WHERE u.id = $1`,
		[userId],
	);
	assert(rows[0], 'Account not found', 404);

	return readRole(rows[0]);
};

// A ban also ends the user's open quizzes, so nobody keeps playing a game they can no longer host.
// canBanAdmins: only full admins may ban another full admin (a role with the users section may not).
export const banUser = async (actorId: number, userId: number, reason: string | null, canBanAdmins: boolean): Promise<void> => {
	assert(actorId !== userId, 'You cannot ban yourself');
	const { rowCount } = await pool.query('UPDATE users SET banned_at = now(), ban_reason = $2 WHERE id = $1 AND ($3 OR NOT is_admin)', [userId, reason, canBanAdmins]);
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
			q.deleted_at IS NOT NULL AS deleted, q.is_public AS "isPublic", q.moderation, q.moderation_reason AS "moderationReason",
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

// Every warning or ban is also noted on the owner, so repeat offenders show up in their account.
// A ban takes the quiz out of the library and ends its live game; copies already made are left alone.
export const moderateQuiz = async (adminId: number, quizId: number, kind: Moderation, reason: string | null): Promise<void> => {
	const { rows } = await pool.query<{ ownerId: number }>(
		`UPDATE quizzes SET moderation = $2, moderation_reason = $3, is_public = is_public AND $2 <> 'banned'
		WHERE id = $1 RETURNING owner_id AS "ownerId"`,
		[quizId, kind, reason],
	);
	assert(rows[0], 'Quiz not found', 404);
	await pool.query('INSERT INTO user_notes (user_id, quiz_id, admin_id, kind, reason) VALUES ($1, $2, $3, $4, $5)', [
		rows[0].ownerId,
		quizId,
		adminId,
		kind,
		reason,
	]);
	// Acting on the quiz answers every open report about it.
	await pool.query('UPDATE quiz_reports SET resolved_at = now(), resolved_by = $2 WHERE quiz_id = $1 AND resolved_at IS NULL', [quizId, adminId]);
	if (kind === 'banned') {
		await closeRun(quizId);
		abortGame(quizId);
	}
};

// Lifts the quiz flag only; the note stays in the owner's history.
export const clearModeration = async (quizId: number): Promise<void> => {
	const { rowCount } = await pool.query('UPDATE quizzes SET moderation = NULL, moderation_reason = NULL WHERE id = $1', [quizId]);
	assert(rowCount, 'Quiz not found', 404);
};

// Open reports oldest first (a queue); resolved ones newest first (history).
export const listReports = async (resolved: boolean): Promise<AdminReport[]> => {
	const { rows } = await pool.query<AdminReport>(
		`SELECT r.id, r.quiz_id AS "quizId", q.title AS "quizTitle", q.owner_id AS "ownerId", o.username AS owner,
			r.reporter_id AS "reporterId", u.username AS reporter, r.reason, r.created_at AS "createdAt",
			r.resolved_at AS "resolvedAt", a.username AS "resolvedBy",
			q.moderation, q.is_public AS "isPublic", q.deleted_at IS NOT NULL AS deleted
		FROM quiz_reports r
		JOIN quizzes q ON q.id = r.quiz_id
		JOIN users o ON o.id = q.owner_id
		JOIN users u ON u.id = r.reporter_id
		LEFT JOIN users a ON a.id = r.resolved_by
		WHERE (r.resolved_at IS NOT NULL) = $1
		ORDER BY CASE WHEN $1 THEN r.resolved_at END DESC, r.created_at
		LIMIT ${LIST_LIMIT}`,
		[resolved],
	);

	return rows;
};

export const dismissReport = async (adminId: number, reportId: number): Promise<void> => {
	const { rowCount } = await pool.query('UPDATE quiz_reports SET resolved_at = now(), resolved_by = $2 WHERE id = $1 AND resolved_at IS NULL', [reportId, adminId]);
	assert(rowCount, 'Report not found', 404);
};

export const listRoles = async (): Promise<AdminRole[]> => {
	const { rows } = await pool.query<{ id: number; users: number } & RoleRow>(
		`SELECT r.id, ${roleColumns('r.id')}, (SELECT count(*)::int FROM users u WHERE u.role_id = r.id) AS users
		FROM roles r ORDER BY r.name`,
	);

	return rows.map((row) => {
		const { role, ...rest } = readRole(row);

		return { ...role!, ...rest };
	});
};

const roleNameTaken = (error: unknown): never => {
	if (isUniqueViolation(error)) {
		throw new HttpError(409, 'A role with this name already exists');
	}

	throw error;
};

const LIMIT_KEYS = Object.keys(LIMIT_COLUMNS) as (keyof PlanLimits)[];

const ROLE_COLUMNS = [...LIMIT_KEYS.map((key) => LIMIT_COLUMNS[key]), ...ADMIN_SECTIONS.map((section) => ADMIN_COLUMNS[section])];

// $1..$3 = name, icon, colour, then one parameter per ROLE_COLUMNS entry.
const roleValues = (role: UserRole): (string | number | boolean | null)[] => [
	role.name,
	role.icon,
	role.color,
	...LIMIT_KEYS.map((key) => role.limits[key] ?? null),
	...ADMIN_SECTIONS.map((section) => role.admin.includes(section)),
];

export const createRole = async (role: UserRole): Promise<void> => {
	const params = ROLE_COLUMNS.map((_, index) => `$${index + 4}`);
	await pool.query(`INSERT INTO roles (name, icon, color, ${ROLE_COLUMNS.join(', ')}) VALUES ($1, $2, $3, ${params.join(', ')})`, roleValues(role))
		.catch(roleNameTaken);
};

export const updateRole = async (roleId: number, role: UserRole): Promise<void> => {
	const sets = ROLE_COLUMNS.map((column, index) => `${column} = $${index + 5}`);
	const result = await pool.query(`UPDATE roles SET name = $2, icon = $3, color = $4, ${sets.join(', ')} WHERE id = $1`, [roleId, ...roleValues(role)])
		.catch(roleNameTaken);
	assert(result.rowCount, 'Role not found', 404);
};

// Holders fall back to their plan (users.role_id is ON DELETE SET NULL).
export const deleteRole = async (roleId: number): Promise<void> => {
	const { rowCount } = await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
	assert(rowCount, 'Role not found', 404);
};

export const setUserRole = async (userId: number, roleId: number | null): Promise<void> => {
	if (roleId !== null) {
		const { rowCount } = await pool.query('SELECT 1 FROM roles WHERE id = $1', [roleId]);
		assert(rowCount, 'Role not found', 404);
	}
	const { rowCount } = await pool.query('UPDATE users SET role_id = $2 WHERE id = $1', [userId, roleId]);
	assert(rowCount, 'Account not found', 404);
};
