import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/utils/Auth';
import { ADMIN_PAGES } from '@/utils/Roles';
import type { AdminArea } from '@/interfaces/User/UserInterface';
import type { MessageKey } from '@/locales/en';

declare module 'vue-router' {
	interface RouteMeta {
		requiresAuth?: boolean;
		requiresAdmin?: boolean;
		immersive?: boolean;
		// Uses the whole window width instead of the centred column (admin).
		wide?: boolean;
		// Admin page: the area the user needs (see AdminArea).
		adminArea?: AdminArea;
		mode?: 'login' | 'register';
		// Indexable page: its <title> and meta description. Pages without it get noindex (see App.vue).
		seo?: { title: MessageKey; description: MessageKey };
	}
}

export const router = createRouter({
	history: createWebHistory(),
	// Back/forward restores the old position; new pages start at the top.
	scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
	routes: [
		{ path: '/', component: () => import('@/views/pages/HomeView.vue'), meta: { seo: { title: 'seo.homeTitle', description: 'seo.homeDescription' } } },
		{ path: '/login', component: () => import('@/views/pages/AuthView.vue'), meta: { mode: 'login', seo: { title: 'seo.loginTitle', description: 'seo.loginDescription' } } },
		{ path: '/register', component: () => import('@/views/pages/AuthView.vue'), meta: { mode: 'register', seo: { title: 'seo.registerTitle', description: 'seo.registerDescription' } } },
		{ path: '/brand', component: () => import('@/views/pages/BrandView.vue'), meta: { seo: { title: 'seo.brandTitle', description: 'seo.brandDescription' } } },
		{
			path: '/terms', component: () => import('@/views/pages/LegalView.vue'), props: { page: 'terms' }, meta: { seo: { title: 'seo.termsTitle', description: 'seo.termsDescription' } },
		},
		{
			path: '/legal', component: () => import('@/views/pages/LegalView.vue'), props: { page: 'legal' }, meta: { seo: { title: 'seo.legalTitle', description: 'seo.legalDescription' } },
		},
		{ path: '/library', component: () => import('@/views/pages/LibraryView.vue'), meta: { seo: { title: 'seo.libraryTitle', description: 'seo.libraryDescription' } } },
		{ path: '/creators/:uid', component: () => import('@/views/pages/CreatorView.vue') },
		{ path: '/auth/callback', component: () => import('@/views/pages/AuthCallbackView.vue') },
		{ path: '/auth/verify', component: () => import('@/views/pages/VerifyEmailView.vue') },
		{ path: '/dashboard', component: () => import('@/views/pages/DashboardView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/new', component: () => import('@/views/pages/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/edit', component: () => import('@/views/pages/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/results', component: () => import('@/views/pages/QuizResultsView.vue'), meta: { requiresAuth: true } },
		{ path: '/host/:id', component: () => import('@/views/pages/HostView.vue'), meta: { requiresAuth: true, immersive: true } },
		{ path: '/play/:code', component: () => import('@/views/pages/PlayView.vue'), meta: { immersive: true } },
		{ path: '/profile/:tab(statistics|settings)?', component: () => import('@/views/pages/ProfileView.vue'), meta: { requiresAuth: true } },
		{
			path: '/admin',
			component: () => import('@/views/pages/AdminView.vue'),
			meta: { requiresAuth: true, requiresAdmin: true, wide: true },
			children: [
				{ path: '', component: () => import('@/views/components/admin/AdminOverview.vue'), meta: { adminArea: 'overview' } },
				{ path: 'users', component: () => import('@/views/components/admin/AdminUsers.vue'), meta: { adminArea: 'users' } },
				{ path: 'quizzes', component: () => import('@/views/components/admin/AdminQuizzes.vue'), meta: { adminArea: 'quizzes' } },
				{ path: 'games', component: () => import('@/views/components/admin/AdminGames.vue'), meta: { adminArea: 'games' } },
				{ path: 'reports', component: () => import('@/views/components/admin/AdminReports.vue'), meta: { adminArea: 'reports' } },
				{ path: 'roles', component: () => import('@/views/components/admin/AdminRoles.vue'), meta: { adminArea: 'roles' } },
			],
		},
		{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/pages/NotFoundView.vue') },
	],
});

router.beforeEach((to) => {
	if (to.meta.requiresAuth && !auth.user) {
		return { path: '/login', query: { redirect: to.fullPath } };
	}
	// UX only: the server checks admin access on every /api/admin call.
	// Same page as a wrong URL (URL kept), so /admin doesn't reveal it exists.
	if (to.meta.requiresAdmin) {
		const areas = auth.user?.adminAreas ?? [];
		if (to.meta.adminArea && !areas.includes(to.meta.adminArea)) {
			// /admin (overview) without the overview: open the first page the user may see instead.
			const first = ADMIN_PAGES.find((page) => areas.includes(page.area));
			if (to.meta.adminArea === 'overview' && first) {
				return first.to;
			}

			return {
				name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') }, query: to.query, hash: to.hash,
			};
		}
	}

	return true;
});
