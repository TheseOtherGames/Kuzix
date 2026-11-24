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
	// Players per game, checked against the quiz owner's plan.
	maxPlayers: number;
}

export interface AuthResponse {
	token: string;
	user: User;
}

// Register answer when the server sends a confirmation email instead of logging in.
export interface ConfirmationResponse {
	confirmationSent: true;
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

export interface Profile {
	nickname: string;
	avatar: string;
}
