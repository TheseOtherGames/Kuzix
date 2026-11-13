<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import type { MessageKey } from '@/locales/en';
import { t } from '@/i18n';

const SECTIONS: { to: string; label: MessageKey; icon: string; tint: string }[] = [
	{
		to: '/admin', label: 'admin.overview', icon: 'chart', tint: 'var(--color-2)',
	},
	{
		to: '/admin/users', label: 'admin.users', icon: 'players', tint: 'var(--color-4)',
	},
	{
		to: '/admin/quizzes', label: 'admin.quizzes', icon: 'folder', tint: 'var(--color-6)',
	},
	{
		to: '/admin/games', label: 'admin.games', icon: 'signal', tint: 'var(--color-1)',
	},
];
</script>

<template>
	<aside class="drawer">
		<p class="drawer-title"><AppIcon name="crown" /> {{ t('admin.title') }}</p>
		<nav class="drawer-nav" :aria-label="t('admin.nav')">
			<RouterLink v-for="section in SECTIONS" :key="section.to" :to="section.to" class="drawer-link" :style="{ '--tint': section.tint }">
				<span class="drawer-icon"><AppIcon :name="section.icon" /></span>
				<span>{{ t(section.label) }}</span>
			</RouterLink>
		</nav>
	</aside>
</template>

<style scoped>
.drawer {
	position: sticky;
	top: calc(var(--header-height) + 1rem);
	padding: 0.75rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
}

.drawer-title {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0.25rem 0.5rem 0.75rem;
	color: var(--text-muted);
	font-size: 0.8rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.drawer-nav {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.drawer-link {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.45rem 0.6rem;
	border-radius: 0.5rem;
	color: var(--text);
	font-weight: 600;
	text-decoration: none;
	white-space: nowrap;
	box-shadow: inset 0 0 0 transparent;
	transition: background 0.15s, box-shadow 0.15s;
}

.drawer-icon {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 2rem;
	height: 2rem;
	border-radius: 0.45rem;
	background: color-mix(in srgb, var(--tint) 18%, transparent);
	font-size: 1.05rem;
	transition: transform 0.2s;
}

.drawer-link:hover {
	background: var(--surface-2);
}

.drawer-link:hover .drawer-icon {
	transform: scale(1.08);
}

.drawer-link.router-link-exact-active {
	background: color-mix(in srgb, var(--accent) 16%, var(--surface));
	box-shadow: inset 3px 0 0 var(--accent-line);
}

/* Under 800px the drawer becomes a scrollable tab strip above the page. */
@media (max-width: 800px) {
	.drawer {
		position: static;
		padding: 0.4rem;
	}

	.drawer-title {
		display: none;
	}

	.drawer-nav {
		flex-direction: row;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.drawer-link {
		flex-shrink: 0;
		padding: 0.35rem 0.75rem 0.35rem 0.35rem;
	}

	.drawer-link.router-link-exact-active {
		box-shadow: inset 0 -3px 0 var(--accent-line);
	}
}
</style>
