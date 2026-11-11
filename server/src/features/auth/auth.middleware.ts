import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../core/httpError';
import { verifyToken } from './auth.service';

const readBearer = (req: Request): number | null => {
	const header = req.headers.authorization;
	return header?.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
	const userId = readBearer(req);
	if (!userId) {
		throw new HttpError(401, 'Authentication required');
	}
	req.userId = userId;
	next();
};
