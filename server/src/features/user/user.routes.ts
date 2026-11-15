import { Router } from 'express';
import type { PlayHistoryEntry } from './user.types';
import { requireAuth } from '../auth/auth.middleware';
import { assert, HttpError } from '../../core/httpError';
import { abortGame } from '../game/game.registry';
import { closeOwnerRuns, listOwnReports, listQuizzes } from '../quiz/quiz.service';
import {claimPlayer,
	cleanAvatar,
	cleanUsername,
	deleteAccount,
	findUserById,
	getHistory,
	getPlayerAnswers,
	getStats,
	isPlayerOwnedBy,
	updateProfile} from './user.service';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', async (req, res) => {
	const user = await findUserById(req.userId!);
	if (!user) {
		throw new HttpError(401, 'Account not found');
	}
	res.json(user);
});

userRouter.patch('/me', async (req, res) => {
	res.json(await updateProfile(req.userId!, cleanUsername(req.body?.username), cleanAvatar(req.body?.avatar)));
});

userRouter.delete('/me', async (req, res) => {
	for (const quizId of await closeOwnerRuns(req.userId!)) {
		abortGame(quizId);
	}
	await deleteAccount(req.userId!);
	res.status(204).end();
});

// Only what the player did: no ids, no other players, no quiz answer key.
const exportGame = async ({ playerId, playersCount: _, ...game }: PlayHistoryEntry): Promise<object> => {
	const answers = await getPlayerAnswers(playerId);

	return {
		...game,
		answers: answers.map(({
			question, answer, isCorrect, points, timeMs,
		}) => ({
			question,
			answer,
			isCorrect,
			points,
			timeMs,
		})),
	};
};

// Everything tied to the account, for the user's right of access (GDPR art. 15).
userRouter.get('/me/export', async (req, res) => {
	const userId = req.userId!;
	const quizzes = await listQuizzes(userId);
	const history = await getHistory(userId);
	const { id: _, ...account } = (await findUserById(userId))!;
	res.json({
		exportedAt: new Date(),
		account,
		stats: await getStats(userId),
		quizzes: quizzes.map(({ title, createdAt }) => ({ title, createdAt })),
		games: await Promise.all(history.map(exportGame)),
		reports: await listOwnReports(userId),
	});
});

userRouter.get('/me/stats', async (req, res) => {
	res.json(await getStats(req.userId!));
});

userRouter.get('/me/history', async (req, res) => {
	res.json(await getHistory(req.userId!));
});

userRouter.get('/me/history/:playerId', async (req, res) => {
	const playerId = Number(req.params.playerId);
	if (!Number.isInteger(playerId) || !(await isPlayerOwnedBy(playerId, req.userId!))) {
		throw new HttpError(404, 'Game not found');
	}
	res.json(await getPlayerAnswers(playerId));
});

userRouter.post('/me/claim', async (req, res) => {
	assert(typeof req.body?.playerToken === 'string', 'Missing player token');
	await claimPlayer(req.userId!, req.body.playerToken);
	res.status(204).end();
});
