import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../core/httpError';

// Run after requireAuth, which reads is_admin fresh from the DB.
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
	if (!req.isAdmin) {
		throw new HttpError(404, 'Not found');
	}
	next();
};
