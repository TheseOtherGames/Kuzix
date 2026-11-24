import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { config } from './core/config';
import { migrate } from './core/db/pool';
import { errorHandler, notFound } from './core/errorHandler';
import { rateLimit } from './core/rateLimit';
import { authRouter } from './features/auth/auth.routes';
import { quizRouter } from './features/quiz/quiz.routes';
import { userRouter } from './features/user/user.routes';
import { adminRouter } from './features/admin/admin.routes';
import { attachGameServer, findGameByCode } from './features/game/game.server';

const app = express();
// Behind nginx: take the client IP from X-Forwarded-For, but only when the proxy is local.
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '1mb' }));
// Generous per-IP limits: a whole classroom can share one IP. Gameplay itself is on the WebSocket.
app.use('/api', rateLimit(600, 60_000));
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/verify'], rateLimit(30, 60_000));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/admin', adminRouter);
// Lets the join page tell a wrong code apart before asking for a nickname.
app.get('/api/games/:code', async (req, res) => {
	res.status(await findGameByCode(req.params.code, req.ip ?? null) ? 204 : 404).end();
});
app.use('/api', notFound);

// Built front (npm run build). Hashed assets never change, so they are cached for a year.
const dist = path.resolve(import.meta.dirname, '../../front/dist');
app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(dist));
// Any other GET is a front route: let the Vue router handle it.
app.get('/{*path}', (_req, res, next) => res.sendFile(path.join(dist, 'index.html'), (error) => error && next(error)));
app.use(notFound);
app.use(errorHandler);

const server = createServer(app);
attachGameServer(server);

await migrate();
server.listen(config.port, () => {
	console.log(`Kuzix server listening on http://localhost:${config.port}`);
});
