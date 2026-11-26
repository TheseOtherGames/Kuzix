import type { AdminArea, AdminSection, PlanLimits, UserRole } from '@/interfaces/User/UserInterface';
import type { MessageKey } from '@/locales/en';
import { t } from '@/i18n';

// Every limit a role can override, in display order (keys of PlanLimits, see server user/roles.ts).
export const ROLE_LIMITS: (keyof PlanLimits)[] = ['maxQuizzes', 'maxQuestions', 'maxPlayers'];

// Icons an admin can give a role: every system icon but the brand and flags.
export const ROLE_ICONS = Object.keys(import.meta.glob('@/shared/icons/*.svg'))
	.map((path) => path.match(/([^/]+)\.svg$/)![1])
	.filter((name) => name !== 'logo' && !name.startsWith('flag'));

export const ROLE_LIMIT_ICONS: Record<keyof PlanLimits, string> = {
	maxQuizzes: 'folder',
	maxQuestions: 'clipboard',
	maxPlayers: 'players',
};

// Admin panel pages, in drawer order. `area` is what a user needs to open one (see AdminArea).
export const ADMIN_PAGES: { area: AdminArea; to: string; label: MessageKey; icon: string; tint: string }[] = [
	{
		area: 'overview', to: '/admin', label: 'admin.overview', icon: 'chart', tint: 'var(--color-2)',
	},
	{
		area: 'users', to: '/admin/users', label: 'admin.users', icon: 'players', tint: 'var(--color-4)',
	},
	{
		area: 'quizzes', to: '/admin/quizzes', label: 'admin.quizzes', icon: 'folder', tint: 'var(--color-6)',
	},
	{
		area: 'games', to: '/admin/games', label: 'admin.games', icon: 'signal', tint: 'var(--color-1)',
	},
	{
		area: 'reports', to: '/admin/reports', label: 'admin.reports.title', icon: 'flag', tint: 'var(--color-5)',
	},
	{
		area: 'roles', to: '/admin/roles', label: 'admin.roles.title', icon: 'tag', tint: 'var(--color-3)',
	},
];

// What a role can grant: every admin page but roles.
export const ADMIN_SECTIONS = ADMIN_PAGES.filter((page) => page.area !== 'roles') as (typeof ADMIN_PAGES[number] & { area: AdminSection })[];

export interface RolePerk {
	key: string;
	icon: string;
	text: string;
}

export const rolePerks = (role: UserRole): RolePerk[] => [
	...ROLE_LIMITS
		.filter((key) => role.limits[key] !== undefined)
		.map((key) => ({ key, icon: ROLE_LIMIT_ICONS[key], text: t(`roles.perk.${key}` as MessageKey, { n: role.limits[key]! }) })),
	...(role.admin.length
		? [{ key: 'admin', icon: 'crown', text: t('roles.perk.admin', { sections: ADMIN_SECTIONS.filter((page) => role.admin.includes(page.area)).map((page) => t(page.label)).join(', ') }) }]
		: []),
];

// Tooltip text wherever a role is shown: what it is, then what it grants.
export const roleTip = (role: UserRole): string => [t('roles.tip', { name: role.name }), ...rolePerks(role).map((perk) => `• ${perk.text}`)].join('\n');
