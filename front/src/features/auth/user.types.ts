export interface User {
	id: number;
	email: string | null;
	username: string;
	avatar: string;
}

export interface AuthResponse {
	token: string;
	user: User;
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
