import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../core/httpError';
import { findQuizIdByUid, getQuiz } from './quiz.service';

// Answers 404, never 403, so it doesn't reveal that someone else's quiz exists.
export const requireQuizOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
	const id = await findQuizIdByUid(req.params.id);
	const quiz = id ? await getQuiz(id) : null;
	if (!quiz || quiz.ownerId !== req.userId) {
		throw new HttpError(404, 'Quiz not found');
	}
	req.quiz = quiz;
	next();
};
