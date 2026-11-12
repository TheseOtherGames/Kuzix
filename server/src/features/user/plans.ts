import type { Plan, PlanLimits } from './user.types';

// New perks go in PlanLimits; new plans (e.g. 'pro') get an entry here and in the Plan type.
export const PLANS: Record<Plan, PlanLimits> = {
	free: { maxQuestions: 20, maxQuizzes: 10 },
};
