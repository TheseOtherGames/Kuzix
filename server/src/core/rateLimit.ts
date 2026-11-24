import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './httpError';

// Fixed window per key (usually a client IP): the first `max` hits of a window pass.
// In-memory, per process; move to a shared store if the server ever runs on several instances.
export const createLimiter = (max: number, windowMs: number) => {
	const hits = new Map<string, { count: number; resetAt: number }>();
	setInterval(() => {
		const now = Date.now();
		for (const [key, hit] of hits) {
			if (hit.resetAt <= now) {
				hits.delete(key);
			}
		}
	}, windowMs).unref();

	return {
		// Milliseconds until the key may try again, 0 when it may now.
		wait: (key: string): number => {
			const hit = hits.get(key);

			return hit && hit.count >= max ? Math.max(0, hit.resetAt - Date.now()) : 0;
		},
		hit: (key: string): void => {
			const now = Date.now();
			const hit = hits.get(key);
			if (!hit || hit.resetAt <= now) {
				hits.set(key, { count: 1, resetAt: now + windowMs });

				return;
			}
			hit.count += 1;
		},
	};
};

// Live gameplay goes through the WebSocket, so this never limits a game in progress.
export const rateLimit = (max: number, windowMs: number) => {
	const limiter = createLimiter(max, windowMs);

	return (req: Request, res: Response, next: NextFunction): void => {
		const ip = req.ip ?? 'unknown';
		const wait = limiter.wait(ip);
		if (wait) {
			res.setHeader('Retry-After', Math.ceil(wait / 1000));

			throw new HttpError(429, 'Too many requests, please slow down');
		}
		limiter.hit(ip);
		next();
	};
};
