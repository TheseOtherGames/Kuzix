import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './httpError';

// Fixed window per client IP. Live gameplay goes through the WebSocket, so this never limits a game in progress.
// In-memory, per process; move to a shared store if the server ever runs on several instances.
export const rateLimit = (max: number, windowMs: number) => {
	const hits = new Map<string, { count: number; resetAt: number }>();
	setInterval(() => {
		const now = Date.now();
		for (const [ip, hit] of hits) {
			if (hit.resetAt <= now) {
				hits.delete(ip);
			}
		}
	}, windowMs).unref();

	return (req: Request, res: Response, next: NextFunction): void => {
		const now = Date.now();
		const ip = req.ip ?? 'unknown';
		let hit = hits.get(ip);
		if (!hit || hit.resetAt <= now) {
			hit = { count: 0, resetAt: now + windowMs };
			hits.set(ip, hit);
		}
		hit.count += 1;
		if (hit.count > max) {
			res.setHeader('Retry-After', Math.ceil((hit.resetAt - now) / 1000));

			throw new HttpError(429, 'Too many requests, please slow down');
		}
		next();
	};
};
