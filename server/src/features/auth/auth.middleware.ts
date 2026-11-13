import type { NextFunction, Request, Response } from 'express';
import { pool } from '../../core/db/pool';
import { HttpError } from '../../core/httpError';
import { verifyToken } from './auth.service';

export const BANNED_MESSAGE = 'This account has been banned';

const readBearer = (req: Request): number | null => {
	const header = req.headers.authorization;

	return header?.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
};

// Reads the account on every request so a ban or an admin change applies at once (tokens are long-lived).
export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
	const userId = readBearer(req);
	if (!userId) {
		throw new HttpError(401, 'Authentication required');
	}
	const { rows } = await pool.query<{ banned: boolean; isAdmin: boolean }>(
		'SELECT banned_at IS NOT NULL AS banned, is_admin AS "isAdmin" FROM users WHERE id = $1',
		[userId],
	);
	if (!rows[0]) {
		throw new HttpError(401, 'Account not found');
	}
	if (rows[0].banned) {
		throw new HttpError(403, BANNED_MESSAGE);
	}
	req.userId = userId;
	req.isAdmin = rows[0].isAdmin;
	next();
};
