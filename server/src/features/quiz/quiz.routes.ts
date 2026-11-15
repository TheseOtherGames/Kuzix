import { Router } from 'express';
import type { QuizDetail } from './quiz.types';
import { readBearer, requireAuth } from '../auth/auth.middleware';
import { requireQuizOwner } from './quiz.middleware';
import { assert, HttpError } from '../../core/httpError';
import {assignNewCode,
	clearStats,
	closeRun,
	copyPublicQuiz,
	createQuiz,
	deleteQuiz,
	duplicateQuiz,
	getOpenRunId,
	hasAnswers,
	isPlayerInQuiz,
	listPublicQuizzes,
	listQuizzes,
	listRuns,
	openRun,
	parseQuizInput,
	previewPublicQuiz,
	pullSource,
	reportPublicQuiz,
	setPublic,
	updateQuiz} from './quiz.service';
import { findUserById, getPlayerAnswers } from '../user/user.service';
import { abortGame, games } from '../game/game.registry';

export const quizRouter = Router();

const maxQuestions = async (userId: number): Promise<number> => {
	return (await findUserById(userId))!.limits.maxQuestions;
};

// The library is readable without an account; copying needs one.
quizRouter.get('/public', async (req, res) => {
	const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
	res.json(await listPublicQuizzes(search, readBearer(req)));
});

quizRouter.get('/public/:uid', async (req, res) => {
	res.json(await previewPublicQuiz(req.params.uid));
});

quizRouter.use(requireAuth);

quizRouter.post('/public/:uid/copy', async (req, res) => {
	res.status(201).json({ uid: await copyPublicQuiz(req.userId!, req.params.uid) });
});

quizRouter.post('/public/:uid/report', async (req, res) => {
	const reason = req.body?.reason;
	assert(typeof reason === 'string' && reason.trim() && reason.length <= 500, 'Reason must be 1 to 500 characters');
	await reportPublicQuiz(req.userId!, req.params.uid, reason.trim());
	res.status(204).end();
});

quizRouter.get('/', async (req, res) => {
	res.json(await listQuizzes(req.userId!));
});

quizRouter.post('/', async (req, res) => {
	const uid = await createQuiz(req.userId!, parseQuizInput(req.body, await maxQuestions(req.userId!)));
	res.status(201).json({ uid });
});

quizRouter.get('/:id', requireQuizOwner, async (req, res) => {
	const detail: QuizDetail = { ...req.quiz!, hasAnswers: await hasAnswers(req.quiz!.id) };
	res.json(detail);
});

quizRouter.put('/:id', requireQuizOwner, async (req, res) => {
	await updateQuiz(req.quiz!, parseQuizInput(req.body, await maxQuestions(req.userId!)));
	res.status(204).end();
});

quizRouter.delete('/:id', requireQuizOwner, async (req, res) => {
	await deleteQuiz(req.quiz!.id);
	abortGame(req.quiz!.id);
	res.status(204).end();
});

quizRouter.post('/:id/code', requireQuizOwner, async (req, res) => {
	assert(await getOpenRunId(req.quiz!.id), 'Open the quiz to get a code', 409);
	const code = await assignNewCode(req.quiz!.id);
	games.get(req.quiz!.id)?.setCode(code);
	res.json({ code });
});

quizRouter.post('/:id/open', requireQuizOwner, async (req, res) => {
	await openRun(req.quiz!.id);
	res.status(204).end();
});

quizRouter.post('/:id/close', requireQuizOwner, async (req, res) => {
	await closeRun(req.quiz!.id);
	abortGame(req.quiz!.id);
	res.status(204).end();
});

quizRouter.post('/:id/duplicate', requireQuizOwner, async (req, res) => {
	res.status(201).json({ uid: await duplicateQuiz(req.quiz!) });
});

quizRouter.put('/:id/public', requireQuizOwner, async (req, res) => {
	assert(typeof req.body?.isPublic === 'boolean', 'isPublic must be a boolean');
	await setPublic(req.quiz!.id, req.body.isPublic);
	res.status(204).end();
});

quizRouter.post('/:id/pull', requireQuizOwner, async (req, res) => {
	await pullSource(req.quiz!);
	res.status(204).end();
});

quizRouter.get('/:id/runs', requireQuizOwner, async (req, res) => {
	res.json(await listRuns(req.quiz!.id));
});

quizRouter.delete('/:id/runs', requireQuizOwner, async (req, res) => {
	await clearStats(req.quiz!.id);
	res.status(204).end();
});

quizRouter.delete('/:id/runs/:runId', requireQuizOwner, async (req, res) => {
	const runId = Number(req.params.runId);
	assert(Number.isInteger(runId), 'Invalid game');
	await clearStats(req.quiz!.id, runId);
	res.status(204).end();
});

quizRouter.get('/:id/players/:playerId', requireQuizOwner, async (req, res) => {
	const playerId = Number(req.params.playerId);
	if (!Number.isInteger(playerId) || !(await isPlayerInQuiz(playerId, req.quiz!.id))) {
		throw new HttpError(404, 'Player not found');
	}
	res.json(await getPlayerAnswers(playerId));
});
