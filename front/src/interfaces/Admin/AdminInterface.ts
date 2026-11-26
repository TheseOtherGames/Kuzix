import type { Moderation } from '@/interfaces/Quiz/QuizInterface';
import type { UserRole } from '@/interfaces/User/UserInterface';

export interface AdminOverview {
	users: number;
	newUsers7d: number;
	quizzes: number;
	openQuizzes: number;
	gamesPlayed: number;
	players: number;
	openReports: number;
	liveGames: number;
	livePlayers: number;
	activity: { day: string; users: number; players: number }[];
}

export interface AdminUser {
	id: number;
	email: string | null;
	username: string;
	avatar: string;
	plan: string;
	isAdmin: boolean;
	roleId: number | null;
	role: UserRole | null;
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
	notes: AdminUserNote[];
}

// A warning or ban one of the user's quizzes received.
export interface AdminUserNote {
	id: number;
	kind: Moderation;
	quizId: number;
	quizTitle: string;
	reason: string | null;
	admin: string;
	createdAt: string;
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
	isPublic: boolean;
	moderation: Moderation | null;
	moderationReason: string | null;
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

export interface AdminReport {
	id: number;
	quizId: number;
	quizTitle: string;
	ownerId: number;
	owner: string;
	reporterId: number;
	reporter: string;
	reason: string;
	createdAt: string;
	resolvedAt: string | null;
	resolvedBy: string | null;
	moderation: Moderation | null;
	isPublic: boolean;
	deleted: boolean;
}

export interface AdminRole extends UserRole {
	id: number;
	// Users holding it.
	users: number;
}
