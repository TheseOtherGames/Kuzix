<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppIcon from '../../shared/ui/AppIcon.vue';
import type { AdminOverview } from './admin.types';
import { api } from '../../shared/api';
import { t, tp } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';

const overview = ref<AdminOverview | null>(null);

const tiles = computed(() => {
	const o = overview.value;
	if (!o) {
		return [];
	}

	return [
		{
			icon: 'players', tint: 'var(--color-4)', label: t('admin.kpi.users'), value: o.users, sub: tp('admin.kpi.newUsers', o.newUsers7d), to: '/admin/users',
		},
		{
			icon: 'folder', tint: 'var(--color-6)', label: t('admin.kpi.quizzes'), value: o.quizzes, sub: tp('admin.kpi.open', o.openQuizzes), to: '/admin/quizzes',
		},
		{
			icon: 'trophy', tint: 'var(--color-3)', label: t('admin.kpi.games'), value: o.gamesPlayed, sub: tp('admin.kpi.players', o.players), to: '/admin/quizzes',
		},
		{
			icon: 'signal', tint: 'var(--color-1)', label: t('admin.kpi.live'), value: o.liveGames, sub: tp('admin.kpi.livePlayers', o.livePlayers), to: '/admin/games',
		},
	];
});

onMounted(async () => {
	try {
		overview.value = await api<AdminOverview>('/admin/overview');
	} catch (error) {
		toast.error((error as Error).message);
	}
});
</script>

<template>
	<header class="admin-head">
		<div>
			<h1>{{ t('admin.overview') }}</h1>
			<p>{{ t('admin.overviewHint') }}</p>
		</div>
	</header>
	<p v-if="!overview" class="admin-empty">{{ t('common.loading') }}</p>
	<div v-else class="tiles">
		<RouterLink v-for="tile in tiles" :key="tile.label" :to="tile.to" class="tile admin-panel" :style="{ '--tint': tile.tint }">
			<span class="tile-icon"><AppIcon :name="tile.icon" /></span>
			<span class="tile-label">{{ tile.label }}</span>
			<strong class="tile-value">{{ tile.value.toLocaleString() }}</strong>
			<span class="tile-sub">{{ tile.sub }}</span>
		</RouterLink>
	</div>
</template>

<style scoped>
.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	gap: 1rem;
}

.tile {
	display: grid;
	grid-template-columns: auto 1fr;
	align-items: center;
	gap: 0.25rem 0.75rem;
	padding: 1rem 1.1rem;
	border-top: 3px solid var(--tint);
	color: var(--text);
	text-decoration: none;
	transition: transform 0.15s, border-color 0.15s;
}

.tile:hover {
	transform: translateY(-2px);
	border-color: var(--tint);
}

.tile-icon {
	display: grid;
	place-items: center;
	grid-row: span 2;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 0.55rem;
	background: color-mix(in srgb, var(--tint) 18%, transparent);
	font-size: 1.3rem;
}

.tile-label {
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 600;
}

.tile-value {
	font-size: 1.9rem;
	line-height: 1.1;
	font-variant-numeric: tabular-nums;
}

.tile-sub {
	grid-column: 1 / -1;
	margin-top: 0.4rem;
	padding-top: 0.5rem;
	border-top: 1px dashed var(--border);
	color: var(--text-muted);
	font-size: 0.85rem;
}
</style>
