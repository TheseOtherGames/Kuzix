import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../core/httpError';
import { findUserById } from '../user/user.service';
import type { AdminArea } from '../user/user.types';

// Run after requireAuth. Reads the user's admin areas fresh (full admin or role sections); none = 404.
export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
	const areas = (await findUserById(req.userId!))?.adminAreas ?? [];
	if (!areas.length) {
		throw new HttpError(404, 'Not found');
	}
	req.adminAreas = areas;
	next();
};

// Route guard: the user needs at least one of these areas. 404 like the rest, so a section never reveals itself.
export const allow = (...areas: AdminArea[]) => (req: Request, _res: Response, next: NextFunction): void => {
	if (!areas.some((area) => req.adminAreas?.includes(area))) {
		throw new HttpError(404, 'Not found');
	}
	next();
};
