<script setup lang="ts">
import AppIcon from '../../shared/ui/AppIcon.vue';
import type { MessageKey } from '../../shared/i18n/en';
import { t } from '../../shared/i18n/i18n';

const SECTIONS: { to: string; label: MessageKey; icon: string; tint: string }[] = [
	{ to: '/admin', label: 'admin.overview', icon: 'chart', tint: 'var(--color-2)' },
	{ to: '/admin/users', label: 'admin.users', icon: 'players', tint: 'var(--color-4)' },
	{ to: '/admin/quizzes', label: 'admin.quizzes', icon: 'folder', tint: 'var(--color-6)' },
	{ to: '/admin/games', label: 'admin.games', icon: 'signal', tint: 'var(--color-1)' },
];
</script>

<template>
	<div class="admin">
		<aside class="drawer">
			<p class="drawer-title"><AppIcon name="crown" /> {{ t('admin.title') }}</p>
			<nav class="drawer-nav" :aria-label="t('admin.nav')">
				<RouterLink v-for="section in SECTIONS" :key="section.to" :to="section.to" class="drawer-link" :style="{ '--tint': section.tint }">
					<span class="drawer-icon"><AppIcon :name="section.icon" /></span>
					<span>{{ t(section.label) }}</span>
				</RouterLink>
			</nav>
		</aside>
		<section class="page">
			<RouterView />
		</section>
	</div>
</template>

<style scoped>
.admin {
	display: grid;
	grid-template-columns: 14rem minmax(0, 1fr);
	align-items: start;
	gap: 1.5rem;
}

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
	.admin {
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
	}

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

/* Shared flat building blocks for every admin page. */
.page :deep(.admin-head) {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	justify-content: space-between;
	gap: 0.75rem 1rem;
	margin-bottom: 1rem;
}

.page :deep(.admin-head h1) {
	margin: 0;
	font-size: clamp(1.4rem, 3vw, 1.8rem);
}

.page :deep(.admin-head p) {
	margin: 0.2rem 0 0;
	color: var(--text-muted);
}

.page :deep(.admin-panel) {
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
}

.page :deep(.admin-search) {
	width: min(100%, 18rem);
}

.page :deep(.table-scroll) {
	overflow-x: auto;
}

.page :deep(.admin-table) {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.95rem;
}

.page :deep(.admin-table th) {
	padding: 0.6rem 0.9rem;
	border-bottom: 1px solid var(--border);
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-align: left;
	text-transform: uppercase;
	white-space: nowrap;
}

.page :deep(.admin-table td) {
	padding: 0.55rem 0.9rem;
	border-bottom: 1px solid var(--border);
	white-space: nowrap;
}

.page :deep(.admin-table tbody tr:last-child td) {
	border-bottom: none;
}

.page :deep(.admin-table tbody tr:hover) {
	background: color-mix(in srgb, var(--surface-2) 60%, transparent);
}

.page :deep(.admin-table .num) {
	text-align: right;
	font-variant-numeric: tabular-nums;
}

.page :deep(.muted) {
	color: var(--text-muted);
}

.page :deep(.admin-empty) {
	margin: 0;
	padding: 2rem 1rem;
	color: var(--text-muted);
	text-align: center;
}

.page :deep(.badge) {
	display: inline-block;
	padding: 0.1rem 0.55rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--badge, var(--text-muted)) 18%, transparent);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--badge, var(--text-muted)) 45%, transparent);
	font-size: 0.8rem;
	font-weight: 600;
}

.page :deep(.badge.good) {
	--badge: var(--success);
}

.page :deep(.badge.bad) {
	--badge: var(--danger);
}

.page :deep(.badge.accent) {
	--badge: var(--accent-line);
}

.page :deep(.code) {
	font-family: var(--font-mono);
}
</style>
