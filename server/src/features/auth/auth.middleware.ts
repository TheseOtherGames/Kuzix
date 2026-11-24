import type { NextFunction, Request, Response } from 'express';
import { pool } from '../../core/db/pool';
import { HttpError } from '../../core/httpError';
import { type TokenClaims, verifyToken } from './auth.service';

export const BANNED_MESSAGE = 'This account has been banned';

const readClaims = (req: Request): TokenClaims | null => {
	const header = req.headers.authorization;

	return header?.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
};

// Token only, no DB check: fine for display hints on public routes, never for access control.
export const readBearer = (req: Request): number | null => {
	return readClaims(req)?.userId ?? null;
};

// Reads the account on every request so a ban or an admin change applies at once (tokens are long-lived).
export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
	const claims = readClaims(req);
	if (!claims) {
		throw new HttpError(401, 'Authentication required');
	}
	// iat has whole seconds: truncating keeps the token issued in the same second as the revocation valid.
	const { rows } = await pool.query<{ banned: boolean; isAdmin: boolean; revoked: boolean }>(
		`SELECT banned_at IS NOT NULL AS banned, is_admin AS "isAdmin",
			coalesce(date_trunc('second', tokens_valid_after) > to_timestamp($2), false) AS revoked
		FROM users WHERE id = $1 AND deleted_at IS NULL`,
		[claims.userId, claims.issuedAt],
	);
	if (!rows[0] || rows[0].revoked) {
		throw new HttpError(401, 'Account not found');
	}
	const { userId } = claims;
	if (rows[0].banned) {
		throw new HttpError(403, BANNED_MESSAGE);
	}
	req.userId = userId;
	req.isAdmin = rows[0].isAdmin;
	next();
};
