import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { assert } from '../../core/httpError';
import { abortGame } from '../game/game.registry';
import { closeRun } from '../quiz/quiz.service';
import { requireAdmin } from './admin.middleware';
import { banUser, getOverview, getUserDetail, listLiveGames, listQuizzes, listUsers, setAdmin, unbanUser } from './admin.service';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const searchOf = (value: unknown): string => (typeof value === 'string' ? value.trim().slice(0, 100) : '');

const idOf = (value: string | string[]): number => {
	const id = Number(value);
	assert(Number.isInteger(id) && id > 0, 'Invalid id');
	return id;
};

adminRouter.get('/overview', async (_req, res) => {
	res.json(await getOverview());
});

adminRouter.get('/users', async (req, res) => {
	res.json(await listUsers(searchOf(req.query.q)));
});

adminRouter.get('/users/:id', async (req, res) => {
	res.json(await getUserDetail(idOf(req.params.id)));
});

adminRouter.post('/users/:id/ban', async (req, res) => {
	const reason = req.body?.reason;
	assert(reason === undefined || reason === null || (typeof reason === 'string' && reason.length <= 300), 'Ban reason must be at most 300 characters');
	await banUser(req.userId!, idOf(req.params.id), reason?.trim() || null);
	res.status(204).end();
});

adminRouter.delete('/users/:id/ban', async (req, res) => {
	await unbanUser(idOf(req.params.id));
	res.status(204).end();
});

adminRouter.patch('/users/:id', async (req, res) => {
	assert(typeof req.body?.isAdmin === 'boolean', 'isAdmin must be a boolean');
	await setAdmin(req.userId!, idOf(req.params.id), req.body.isAdmin);
	res.status(204).end();
});

adminRouter.get('/quizzes', async (req, res) => {
	res.json(await listQuizzes(searchOf(req.query.q)));
});

adminRouter.get('/games', (_req, res) => {
	res.json(listLiveGames());
});

// Same as the owner's "Close": ends the run (new code) and kicks everyone out.
adminRouter.post('/quizzes/:id/close', async (req, res) => {
	const quizId = idOf(req.params.id);
	await closeRun(quizId);
	abortGame(quizId);
	res.status(204).end();
});
