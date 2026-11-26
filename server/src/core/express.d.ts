import type { Quiz } from '../features/quiz/quiz.types';
import type { AdminArea } from '../features/user/user.types';

declare global {
	namespace Express {
		interface Request {
			userId?: number;
			isAdmin?: boolean;
			adminAreas?: AdminArea[];
			quiz?: Quiz;
		}
	}
}

export {};
