export interface User {
	id: number;
	// Public profile reference (/creators/<uid>).
	uid: string;
	email: string | null;
	username: string;
	avatar: string;
	plan: Plan;
	// Full admin: every admin area, including roles and the admin flag.
	isAdmin: boolean;
	// Admin panel areas this user may open: all for a full admin, else the ones their role grants.
	adminAreas: AdminArea[];
	providers: string[];
	// Admin-given role; its limits override the plan's (already merged into `limits`).
	role: UserRole | null;
	limits: PlanLimits;
}

// What anyone may see of a role: shown on public profiles and library cards.
export interface UserRole {
	name: string;
	// System icon name (front/src/shared/icons).
	icon: string;
	// #rrggbb
	color: string;
	limits: Partial<PlanLimits>;
	// Admin panel sections the role opens.
	admin: AdminSection[];
}

// Admin sections a role can grant.
export type AdminSection = 'overview' | 'users' | 'quizzes' | 'games' | 'reports';
// 'roles' = managing roles, role assignment and the admin flag: full admins only, never granted by a role.
export type AdminArea = AdminSection | 'roles';

export type Plan = 'free';

export interface PlanLimits {
	maxQuestions: number;
	maxQuizzes: number;
	// Players per game, checked against the quiz owner's plan.
	maxPlayers: number;
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
