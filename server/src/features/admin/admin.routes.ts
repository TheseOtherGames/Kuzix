import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { assert } from '../../core/httpError';
import { abortGame } from '../game/game.registry';
import { closeRun, getQuiz, toPreview } from '../quiz/quiz.service';
import { allow, requireAdmin } from './admin.middleware';
import { banUser, clearModeration, createRole, deleteRole, dismissReport, getOverview, getUserDetail, listLiveGames, listQuizzes, listReports, listRoles, listUsers, moderateQuiz, setAdmin, setUserRole, unbanUser, updateRole } from './admin.service';
import { cleanRoleInput } from '../user/roles';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const searchOf = (value: unknown): string => (typeof value === 'string' ? value.trim().slice(0, 100) : '');

const idOf = (value: string | string[]): number => {
	const id = Number(value);
	assert(Number.isInteger(id) && id > 0, 'Invalid id');

	return id;
};

adminRouter.get('/overview', allow('overview'), async (_req, res) => {
	res.json(await getOverview());
});

adminRouter.get('/users', allow('users'), async (req, res) => {
	res.json(await listUsers(searchOf(req.query.q)));
});

// Read by the user popup, opened from every section (quiz owners, reporters): any admin area.
adminRouter.get('/users/:id', async (req, res) => {
	res.json(await getUserDetail(idOf(req.params.id)));
});

const reasonOf = (body: { reason?: unknown } | undefined): string | null => {
	const reason = body?.reason;
	assert(reason === undefined || reason === null || (typeof reason === 'string' && reason.length <= 300), 'Reason must be at most 300 characters');

	return (reason as string | null | undefined)?.trim() || null;
};

adminRouter.post('/users/:id/ban', allow('users'), async (req, res) => {
	await banUser(req.userId!, idOf(req.params.id), reasonOf(req.body), req.adminAreas!.includes('roles'));
	res.status(204).end();
});

adminRouter.delete('/users/:id/ban', allow('users'), async (req, res) => {
	await unbanUser(idOf(req.params.id));
	res.status(204).end();
});

adminRouter.patch('/users/:id', allow('roles'), async (req, res) => {
	assert(typeof req.body?.isAdmin === 'boolean', 'isAdmin must be a boolean');
	await setAdmin(req.userId!, idOf(req.params.id), req.body.isAdmin);
	res.status(204).end();
});

adminRouter.get('/quizzes', allow('quizzes'), async (req, res) => {
	res.json(await listQuizzes(searchOf(req.query.q)));
});

adminRouter.get('/games', allow('games'), (_req, res) => {
	res.json(listLiveGames());
});

// Same as the owner's "Close": ends the run (new code) and kicks everyone out.
adminRouter.post('/quizzes/:id/close', allow('quizzes', 'games'), async (req, res) => {
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

adminRouter.post('/quizzes/:id/moderation', allow('quizzes', 'reports'), async (req, res) => {
	const kind = req.body?.kind;
	assert(kind === 'warned' || kind === 'banned', 'Invalid moderation');
	await moderateQuiz(req.userId!, idOf(req.params.id), kind, reasonOf(req.body));
	res.status(204).end();
});

adminRouter.delete('/quizzes/:id/moderation', allow('quizzes', 'reports'), async (req, res) => {
	await clearModeration(idOf(req.params.id));
	res.status(204).end();
});

adminRouter.get('/reports', allow('reports'), async (req, res) => {
	res.json(await listReports(req.query.status === 'resolved'));
});

adminRouter.post('/reports/:id/dismiss', allow('reports'), async (req, res) => {
	await dismissReport(req.userId!, idOf(req.params.id));
	res.status(204).end();
});

adminRouter.get('/roles', allow('roles'), async (_req, res) => {
	res.json(await listRoles());
});

adminRouter.post('/roles', allow('roles'), async (req, res) => {
	await createRole(cleanRoleInput(req.body));
	res.status(204).end();
});

adminRouter.put('/roles/:id', allow('roles'), async (req, res) => {
	await updateRole(idOf(req.params.id), cleanRoleInput(req.body));
	res.status(204).end();
});

adminRouter.delete('/roles/:id', allow('roles'), async (req, res) => {
	await deleteRole(idOf(req.params.id));
	res.status(204).end();
});

adminRouter.put('/users/:id/role', allow('roles'), async (req, res) => {
	const roleId = req.body?.roleId ?? null;
	await setUserRole(idOf(req.params.id), roleId === null ? null : idOf(String(roleId)));
	res.status(204).end();
});
