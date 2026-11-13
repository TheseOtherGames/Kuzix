import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { assert, HttpError } from '../../core/httpError';
import {claimPlayer,
	cleanAvatar,
	cleanUsername,
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
