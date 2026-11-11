import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../features/auth/auth.store';

declare module 'vue-router' {
	interface RouteMeta {
		requiresAuth?: boolean;
		immersive?: boolean;
		mode?: 'login' | 'register';
	}
}

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', component: () => import('../features/home/HomeView.vue') },
		{ path: '/login', component: () => import('../features/auth/AuthView.vue'), meta: { mode: 'login' } },
		{ path: '/register', component: () => import('../features/auth/AuthView.vue'), meta: { mode: 'register' } },
		{ path: '/auth/callback', component: () => import('../features/auth/AuthCallbackView.vue') },
		{ path: '/dashboard', component: () => import('../features/quiz/DashboardView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/new', component: () => import('../features/quiz/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/edit', component: () => import('../features/quiz/QuizEditorView.vue'), meta: { requiresAuth: true } },
		{ path: '/quizzes/:id/results', component: () => import('../features/quiz/QuizResultsView.vue'), meta: { requiresAuth: true } },
		{ path: '/host/:id', component: () => import('../features/game/HostView.vue'), meta: { requiresAuth: true, immersive: true } },
		{ path: '/play/:code', component: () => import('../features/game/PlayView.vue'), meta: { immersive: true } },
		{ path: '/profile', component: () => import('../features/profile/ProfileView.vue'), meta: { requiresAuth: true } },
		{ path: '/:pathMatch(.*)*', component: () => import('./NotFoundView.vue') },
	],
});

router.beforeEach((to) => {
	if (to.meta.requiresAuth && !auth.user) {
		return { path: '/login', query: { redirect: to.fullPath } };
	}
	return true;
});
