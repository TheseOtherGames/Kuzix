import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/features/auth/auth.store';
import type { MessageKey } from '@/shared/i18n/en';

declare module 'vue-router' {
	interface RouteMeta {
		requiresAuth?: boolean;
		requiresAdmin?: boolean;
		immersive?: boolean;
		mode?: 'login' | 'register';
		// Indexable page: its <title> and meta description. Pages without it get noindex (see App.vue).
		seo?: { title: MessageKey; description: MessageKey };
	}
}

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', component: () => import('@/features/home/HomeView.vue'), meta: { seo: { title: 'seo.homeTitle', description: 'seo.homeDescription' } } },
		{ path: '/login', component: () => import('@/features/auth/AuthView.vue'), meta: { mode: 'login', seo: { title: 'seo.loginTitle', description: 'seo.loginDescription' } } },
		{ path: '/register', component: () => import('@/features/auth/AuthView.vue'), meta: { mode: 'register', seo: { title: 'seo.registerTitle', description: 'seo.registerDescription' } } },
		{ path: '/auth/callback', component: () => import('@/features/auth/AuthCallbackView.vue') },
		{ path: '/dashboard', component: () => import('@/features/quiz/DashboardView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/new', component: () => import('@/features/quiz/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/edit', component: () => import('@/features/quiz/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/results', component: () => import('@/features/quiz/QuizResultsView.vue'), meta: { requiresAuth: true } },
		{ path: '/host/:id', component: () => import('@/features/game/HostView.vue'), meta: { requiresAuth: true, immersive: true } },
		{ path: '/play/:code', component: () => import('@/features/game/PlayView.vue'), meta: { immersive: true } },
		{ path: '/profile/:tab(statistics|settings)?', component: () => import('@/features/profile/ProfileView.vue'), meta: { requiresAuth: true } },
		{
			path: '/admin',
			component: () => import('@/features/admin/AdminView.vue'),
			meta: { requiresAuth: true, requiresAdmin: true },
			children: [
				{ path: '', component: () => import('@/features/admin/AdminOverview.vue') },
				{ path: 'users', component: () => import('@/features/admin/AdminUsers.vue') },
				{ path: 'quizzes', component: () => import('@/features/admin/AdminQuizzes.vue') },
				{ path: 'games', component: () => import('@/features/admin/AdminGames.vue') },
			],
		},
		{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/app/NotFoundView.vue') },
	],
});

router.beforeEach((to) => {
	if (to.meta.requiresAuth && !auth.user) {
		return { path: '/login', query: { redirect: to.fullPath } };
	}
	// UX only: the server checks admin access on every /api/admin call.
	// Same page as a wrong URL (URL kept), so /admin doesn't reveal it exists.
	if (to.meta.requiresAdmin && !auth.user?.isAdmin) {
		return {
			name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') }, query: to.query, hash: to.hash,
		};
	}

	return true;
});
