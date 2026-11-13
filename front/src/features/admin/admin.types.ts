export interface AdminOverview {
	users: number;
	newUsers7d: number;
	quizzes: number;
	openQuizzes: number;
	gamesPlayed: number;
	players: number;
	liveGames: number;
	livePlayers: number;
}

export interface AdminUser {
	id: number;
	email: string | null;
	username: string;
	avatar: string;
	plan: string;
	isAdmin: boolean;
	bannedAt: string | null;
	createdAt: string;
	quizzes: number;
	gamesPlayed: number;
}

export interface AdminUserDetail extends AdminUser {
	banReason: string | null;
	totalScore: number;
	hasPassword: boolean;
	providers: string[];
	quizList: { id: number; title: string; questions: number; isOpen: boolean; deleted: boolean }[];
}

export interface AdminQuiz {
	id: number;
	title: string;
	code: string | null;
	ownerId: number;
	owner: string;
	questions: number;
	runs: number;
	isOpen: boolean;
	deleted: boolean;
	createdAt: string;
}

export interface AdminLiveGame {
	quizId: number;
	title: string;
	code: string | null;
	phase: string;
	hostConnected: boolean;
	players: number;
	connected: number;
}
