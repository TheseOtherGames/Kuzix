import { Router } from 'express';
import type { QuizDetail } from './quiz.types';
import { requireAuth } from '../auth/auth.middleware';
import { requireQuizOwner } from './quiz.middleware';
import { assert, HttpError } from '../../core/httpError';
import {
	assignNewCode,
	clearStats,
	closeRun,
	createQuiz,
	deleteQuiz,
	duplicateQuiz,
	hasAnswers,
	isPlayerInQuiz,
	listQuizzes,
	listRuns,
	openRun,
	parseQuizInput,
	updateQuiz,
} from './quiz.service';
import { findUserById, getPlayerAnswers } from '../user/user.service';
import { abortGame, games } from '../game/game.registry';

export const quizRouter = Router();

const maxQuestions = async (userId: number): Promise<number> => {
	return (await findUserById(userId))!.limits.maxQuestions;
};

quizRouter.use(requireAuth);

quizRouter.get('/', async (req, res) => {
	res.json(await listQuizzes(req.userId!));
});

quizRouter.post('/', async (req, res) => {
	const id = await createQuiz(req.userId!, parseQuizInput(req.body, await maxQuestions(req.userId!)));
	res.status(201).json({ id });
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
	res.status(201).json({ id: await duplicateQuiz(req.quiz!) });
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
