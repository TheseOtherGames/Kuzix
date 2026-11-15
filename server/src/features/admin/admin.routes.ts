import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { assert } from '../../core/httpError';
import { abortGame } from '../game/game.registry';
import { closeRun, getQuiz, toPreview } from '../quiz/quiz.service';
import { requireAdmin } from './admin.middleware';
import { banUser, clearModeration, dismissReport, getOverview, getUserDetail, listLiveGames, listQuizzes, listReports, listUsers, moderateQuiz, setAdmin, unbanUser } from './admin.service';

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

const reasonOf = (body: { reason?: unknown } | undefined): string | null => {
	const reason = body?.reason;
	assert(reason === undefined || reason === null || (typeof reason === 'string' && reason.length <= 300), 'Reason must be at most 300 characters');

	return (reason as string | null | undefined)?.trim() || null;
};

adminRouter.post('/users/:id/ban', async (req, res) => {
	await banUser(req.userId!, idOf(req.params.id), reasonOf(req.body));
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

// Any quiz, deleted ones included, with its correct answers: what a moderator needs to judge it.
adminRouter.get('/quizzes/:id', async (req, res) => {
	const quiz = await getQuiz(idOf(req.params.id), true);
	assert(quiz, 'Quiz not found', 404);
	res.json(await toPreview(quiz, true));
});

adminRouter.post('/quizzes/:id/moderation', async (req, res) => {
	const kind = req.body?.kind;
	assert(kind === 'warned' || kind === 'banned', 'Invalid moderation');
	await moderateQuiz(req.userId!, idOf(req.params.id), kind, reasonOf(req.body));
	res.status(204).end();
});

adminRouter.delete('/quizzes/:id/moderation', async (req, res) => {
	await clearModeration(idOf(req.params.id));
	res.status(204).end();
});

adminRouter.get('/reports', async (req, res) => {
	res.json(await listReports(req.query.status === 'resolved'));
});

adminRouter.post('/reports/:id/dismiss', async (req, res) => {
	await dismissReport(req.userId!, idOf(req.params.id));
	res.status(204).end();
});
