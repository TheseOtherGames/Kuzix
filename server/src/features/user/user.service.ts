import { pool, withTransaction } from '../../core/db/pool';
import type { OAuthProfile, Plan, PlayHistoryEntry, User, UserStats } from './user.types';
import { PLANS } from './plans';
import type { PlayerAnswerDetail } from '../quiz/quiz.types';
import { assert, HttpError } from '../../core/httpError';
import { POINTS_PER_DIFFICULTY } from '../game/scoring';

// providers: how the account can log in ('password' + linked OAuth providers).
const USER_COLUMNS = `id, email, username, avatar, plan, is_admin AS "isAdmin",
	ARRAY(SELECT 'password' WHERE users.password_hash IS NOT NULL
		UNION ALL SELECT provider FROM user_identities WHERE user_id = users.id ORDER BY 1) AS providers`;

type UserRow = Omit<User, 'limits'>;

const toUser = <T extends UserRow>(row: T): T & User => {
	return { ...row, limits: PLANS[row.plan as Plan] ?? PLANS.free };
};

export const cleanUsername = (value: unknown): string => {
	const username = typeof value === 'string' ? value.trim() : '';
	assert(username.length >= 1 && username.length <= 24, 'Username must be 1 to 24 characters');
	return username;
};

export const cleanAvatar = (value: unknown): string => {
	const avatar = typeof value === 'string' ? value.trim() : '';
	assert(avatar.length >= 1 && avatar.length <= 64, 'Invalid avatar');
	return avatar;
};

export const findUserById = async (id: number): Promise<User | null> => {
	const { rows } = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
	return rows[0] ? toUser(rows[0]) : null;
};

export const findUserWithPassword = async (email: string): Promise<(User & { passwordHash: string | null; banned: boolean }) | null> => {
	const { rows } = await pool.query<UserRow & { passwordHash: string | null; banned: boolean }>(
		`SELECT ${USER_COLUMNS}, password_hash AS "passwordHash", banned_at IS NOT NULL AS banned FROM users WHERE email = $1`,
		[email],
	);
	return rows[0] ? toUser(rows[0]) : null;
};

export const createUser = async (email: string, passwordHash: string, username: string): Promise<User> => {
	const { rows } = await pool.query<UserRow>(
		`INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
		[email, passwordHash, username],
	);
	return toUser(rows[0]);
};

export const findOrCreateOAuthUser = async (provider: string, profile: OAuthProfile): Promise<User> => {
	return withTransaction(async (client) => {
		const identity = await client.query<UserRow>(
			`SELECT ${USER_COLUMNS} FROM users
			WHERE id = (SELECT user_id FROM user_identities WHERE provider = $1 AND provider_user_id = $2)`,
			[provider, profile.id],
		);
		if (identity.rows[0]) {
			return toUser(identity.rows[0]);
		}
		let user: UserRow | undefined;
		if (profile.email) {
			const existing = await client.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [profile.email]);
			user = existing.rows[0];
		}
		if (!user) {
			const created = await client.query<UserRow>(
				`INSERT INTO users (email, username) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
				[profile.email, profile.username.slice(0, 24)],
			);
			user = created.rows[0];
		}
		await client.query(
			'INSERT INTO user_identities (provider, provider_user_id, user_id) VALUES ($1, $2, $3)',
			[provider, profile.id, user.id],
		);
		return toUser(user);
	});
};

export const updateProfile = async (id: number, username: string, avatar: string): Promise<User> => {
	const { rows } = await pool.query<UserRow>(
		`UPDATE users SET username = $2, avatar = $3 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
		[id, username, avatar],
	);
	return toUser(rows[0]);
};

export const claimPlayer = async (userId: number, playerToken: string): Promise<void> => {
	const { rowCount } = await pool.query(
		'UPDATE players SET user_id = $1 WHERE token = $2 AND user_id IS NULL',
		[userId, playerToken],
	);
	if (!rowCount) {
		throw new HttpError(404, 'Score not found or already saved');
	}
};

export const getHistory = async (userId: number): Promise<PlayHistoryEntry[]> => {
	const { rows } = await pool.query<PlayHistoryEntry>(
		`SELECT p.id AS "playerId", q.title AS "quizTitle", p.nickname, p.avatar, p.score, p.rank,
			(SELECT count(*)::int FROM players o WHERE o.run_id = p.run_id) AS "playersCount",
			p.joined_at AS "playedAt"
		FROM players p
		JOIN runs r ON r.id = p.run_id
		JOIN quizzes q ON q.id = r.quiz_id
		WHERE p.user_id = $1
		ORDER BY p.joined_at DESC`,
		[userId],
	);
	return rows;
};

export const getStats = async (userId: number): Promise<UserStats> => {
	const { rows } = await pool.query<UserStats>(
		`SELECT
			(SELECT count(*)::int FROM players WHERE user_id = $1) AS "gamesPlayed",
			(SELECT coalesce(sum(score), 0)::int FROM players WHERE user_id = $1) AS "totalScore",
			(SELECT min(rank) FROM players WHERE user_id = $1) AS "bestRank",
			count(pa.*)::int AS answered,
			count(pa.*) FILTER (WHERE a.is_correct)::int AS correct
		FROM players p
		JOIN player_answers pa ON pa.player_id = p.id
		JOIN answers a ON a.id = pa.answer_id
		WHERE p.user_id = $1`,
		[userId],
	);
	return rows[0];
};

// Includes unanswered questions of the run's quiz so the player sees what they missed.
export const getPlayerAnswers = async (playerId: number): Promise<PlayerAnswerDetail[]> => {
	const { rows } = await pool.query<PlayerAnswerDetail>(
		`SELECT qu.text AS question, a.text AS answer, coalesce(a.is_correct, false) AS "isCorrect",
			coalesce(pa.points, 0) AS points, pa.time_ms AS "timeMs",
			qu.time_limit AS "timeLimit", qu.difficulty * $2 AS "maxPoints",
			(SELECT string_agg(ca.text, ' / ' ORDER BY ca.position) FROM answers ca
				WHERE ca.question_id = qu.id AND ca.is_correct) AS "correctAnswer"
		FROM players p
		JOIN runs r ON r.id = p.run_id
		JOIN questions qu ON qu.quiz_id = r.quiz_id
		LEFT JOIN player_answers pa ON pa.player_id = p.id AND pa.question_id = qu.id
		LEFT JOIN answers a ON a.id = pa.answer_id
		WHERE p.id = $1
		ORDER BY qu.position`,
		[playerId, POINTS_PER_DIFFICULTY],
	);
	return rows;
};

export const isPlayerOwnedBy = async (playerId: number, userId: number): Promise<boolean> => {
	const { rowCount } = await pool.query('SELECT 1 FROM players WHERE id = $1 AND user_id = $2', [playerId, userId]);
	return Boolean(rowCount);
};

export const isBanned = async (userId: number): Promise<boolean> => {
	const { rowCount } = await pool.query('SELECT 1 FROM users WHERE id = $1 AND banned_at IS NOT NULL', [userId]);
	return Boolean(rowCount);
};
