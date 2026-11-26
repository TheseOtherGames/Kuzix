import { assert } from '../../core/httpError';
import { PLANS } from './plans';
import type { AdminArea, AdminSection, PlanLimits, UserRole } from './user.types';

const MAX_LIMIT = 10000;

// One nullable roles column per PlanLimits key: a new perk needs its column in schema.sql too.
export const LIMIT_COLUMNS: Record<keyof PlanLimits, string> = {
	maxQuestions: 'max_questions',
	maxQuizzes: 'max_quizzes',
	maxPlayers: 'max_players',
};

// One boolean roles column per admin section a role can open.
export const ADMIN_COLUMNS: Record<AdminSection, string> = {
	overview: 'admin_overview',
	users: 'admin_users',
	quizzes: 'admin_quizzes',
	games: 'admin_games',
	reports: 'admin_reports',
};

export const ADMIN_SECTIONS = Object.keys(ADMIN_COLUMNS) as AdminSection[];

const ROLE_FIELDS: Record<string, string> = {
	name: 'name',
	icon: 'icon',
	color: 'color',
	...LIMIT_COLUMNS,
	...Object.fromEntries(ADMIN_SECTIONS.map((section) => [`admin.${section}`, ADMIN_COLUMNS[section]])),
};

// Flat role columns as selected by roleColumns: all NULL when there is no role.
export type RoleRow = Record<`role.${string}`, string | number | boolean | null>;

// SQL select list for the role behind `roleIdColumn`, as "role.<field>" columns. Read them back with readRole.
// Correlated subqueries rather than a JOIN, so it also works in INSERT/UPDATE ... RETURNING.
// The inner alias is unusual on purpose: a plain `r` would shadow an outer `roles r` and match every row.
export const roleColumns = (roleIdColumn: string): string => Object.entries(ROLE_FIELDS)
	.map(([field, column]) => `(SELECT role_of.${column} FROM roles role_of WHERE role_of.id = ${roleIdColumn}) AS "role.${field}"`)
	.join(', ');

// Swaps a row's flat role columns for `role`.
export const readRole = <T extends object>(row: T): Omit<T, `role.${string}`> & { role: UserRole | null } => {
	const flat = row as Record<string, unknown>;
	const rest = Object.fromEntries(Object.entries(flat).filter(([key]) => !key.startsWith('role.'))) as Omit<T, `role.${string}`>;
	if (flat['role.name'] === null || flat['role.name'] === undefined) {
		return { ...rest, role: null };
	}
	const limits: Partial<PlanLimits> = {};
	for (const key of Object.keys(LIMIT_COLUMNS) as (keyof PlanLimits)[]) {
		if (flat[`role.${key}`] !== null) {
			limits[key] = flat[`role.${key}`] as number;
		}
	}

	return {
		...rest,
		role: {
			name: flat['role.name'] as string,
			icon: flat['role.icon'] as string,
			color: flat['role.color'] as string,
			limits,
			admin: ADMIN_SECTIONS.filter((section) => flat[`role.admin.${section}`] === true),
		},
	};
};

export const adminAreasOf = (isAdmin: boolean, role: UserRole | null): AdminArea[] => (isAdmin ? [...ADMIN_SECTIONS, 'roles'] : role?.admin ?? []);

// A role overrides the plan value of every limit it sets, up or down.
export const mergeLimits = (plan: PlanLimits, role: UserRole | null): PlanLimits => ({ ...plan, ...role?.limits });

export const cleanRoleInput = (body: unknown): UserRole => {
	const input = (body ?? {}) as Record<string, unknown>;
	const name = typeof input.name === 'string' ? input.name.trim() : '';
	assert(name.length >= 1 && name.length <= 24, 'Role name must be 1 to 24 characters');
	assert(typeof input.icon === 'string' && /^[a-z0-9-]{1,32}$/.test(input.icon), 'Invalid role icon');
	assert(typeof input.color === 'string' && /^#[0-9a-f]{6}$/i.test(input.color), 'Invalid role color');
	const given = (input.limits ?? {}) as Record<string, unknown>;
	assert(typeof given === 'object' && !Array.isArray(given), 'Invalid role permissions');
	const limits: Partial<PlanLimits> = {};
	for (const key of Object.keys(PLANS.free) as (keyof PlanLimits)[]) {
		const value = given[key];
		if (value === undefined || value === null) {
			continue;
		}
		assert(Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_LIMIT, 'Role limits must be whole numbers from 1 to 10000');
		limits[key] = value as number;
	}

	assert(input.admin === undefined || Array.isArray(input.admin), 'Invalid role permissions');
	const admin = ADMIN_SECTIONS.filter((section) => (input.admin as unknown[] | undefined)?.includes(section));

	return {
		name, icon: input.icon, color: input.color.toLowerCase(), limits, admin,
	};
};
