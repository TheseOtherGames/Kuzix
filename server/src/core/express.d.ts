import type { Quiz } from '../features/quiz/quiz.types';

declare global {
	namespace Express {
		interface Request {
			userId?: number;
			isAdmin?: boolean;
			quiz?: Quiz;
		}
	}
}

export {};
