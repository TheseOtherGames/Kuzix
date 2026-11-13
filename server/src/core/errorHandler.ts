import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './httpError';

export const notFound = (_req: Request, res: Response): void => {
	res.status(404).json({ error: 'Not found' });
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
	if (error instanceof HttpError) {
		res.status(error.status).json({ error: error.message });

		return;
	}
	const status = (error as { status?: number }).status;
	if (status && status >= 400 && status < 500) {
		res.status(status).json({ error: 'Invalid request' });

		return;
	}
	console.error(error);
	res.status(500).json({ error: 'Internal server error' });
};
