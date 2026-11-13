export interface User {
	id: number;
	email: string | null;
	username: string;
	avatar: string;
	plan: Plan;
	isAdmin: boolean;
	providers: string[];
	limits: PlanLimits;
}

export type Plan = 'free';

export interface PlanLimits {
	maxQuestions: number;
	maxQuizzes: number;
}

export interface OAuthProfile {
	id: string;
	email: string | null;
	username: string;
}

export interface OAuthProvider {
	authorizeUrl: string;
	tokenUrl: string;
	scope: string;
	clientId: string;
	clientSecret: string;
	fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}

export interface UserStats {
	gamesPlayed: number;
	totalScore: number;
	bestRank: number | null;
	answered: number;
	correct: number;
}

export interface PlayHistoryEntry {
	playerId: number;
	quizTitle: string;
	nickname: string;
	avatar: string;
	score: number;
	rank: number | null;
	playersCount: number;
	playedAt: string;
}
