<script setup lang="ts">
import AdminDrawer from '@/views/components/admin/AdminDrawer.vue';
</script>

<template>
	<div class="admin">
		<AdminDrawer />
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

/* Under 800px the drawer becomes a scrollable tab strip above the page. */
@media (max-width: 800px) {
	.admin {
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
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

/* Row actions (Quizzes moderation, Reports): flex on an inner div, a flex <td> stops being a table cell. */
.page :deep(.mod) {
	display: flex;
	align-items: center;
	gap: 0.35rem;
}

.page :deep(.mod-action) {
	padding: 0.15rem 0.5rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: none;
	color: var(--text-muted);
	font: inherit;
	font-size: 0.8rem;
	white-space: nowrap;
	cursor: pointer;
	transition: border-color 0.15s, color 0.15s;
}

.page :deep(.mod-action:hover) {
	border-color: var(--accent-line);
	color: var(--accent-text);
}

.page :deep(.mod-action.danger:hover) {
	border-color: var(--danger);
	color: var(--danger);
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
