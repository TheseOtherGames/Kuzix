<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '../../shared/ui/AppIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import Leaderboard, { type LeaderboardEntry } from '../../shared/ui/Leaderboard.vue';
import PillButton from '../../shared/ui/PillButton.vue';
import PlayerReport from '../../shared/ui/PlayerReport.vue';
import type { PlayerAnswerDetail, Quiz, Run } from './quiz.types';
import { api } from '../../shared/api';
import { ANSWER_COLORS } from '../../shared/answers';
import { downloadFile, slugify } from '../../shared/download';
import { locale, t, tp } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';

const route = useRoute();
const quizId = route.params.id as string;
const title = ref('');
const runs = ref<Run[]>([]);
const selected = ref<LeaderboardEntry | null>(null);
const selectedCount = ref(0);
const answers = ref<PlayerAnswerDetail[]>([]);
// 'all' = every finished session, a run = just that one.
const clearing = ref<Run | 'all' | null>(null);

const clearStats = async (): Promise<void> => {
	const target = clearing.value;
	try {
		await api(target === 'all' ? `/quizzes/${quizId}/runs` : `/quizzes/${quizId}/runs/${target!.id}`, 'DELETE');
		runs.value = runs.value.filter((run) => target === 'all' ? !run.endedAt : run !== target);
		clearing.value = null;
		toast.success(t('results.cleared'));
	} catch (error) {
		toast.error((error as Error).message);
	}
};

onMounted(async () => {
	try {
		const [quiz, list] = await Promise.all([api<Quiz>(`/quizzes/${quizId}`), api<Run[]>(`/quizzes/${quizId}/runs`)]);
		title.value = quiz.title;
		runs.value = list;
	} catch (error) {
		toast.error((error as Error).message);
	}
});

// Quotes every cell and defuses spreadsheet formulas, since nicknames come from players.
const csvCell = (value: string | number | boolean | null): string => {
	const text = String(value ?? '');

	return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
};

// No run = every session; a run = only that session's players.
const exportStats = (only?: Run): void => {
	const header = [
		t('csv.game'),
		t('csv.started'),
		t('csv.ended'),
		t('csv.rank'),
		t('csv.nickname'),
		t('csv.registered'),
		t('csv.score'),
	];
	const rows = runs.value.flatMap((run, i) => (only && run !== only ? [] : run.players).map((player) => [
		runs.value.length - i,
		run.startedAt,
		run.endedAt,
		player.rank,
		player.nickname,
		player.registered,
		player.score,
	]));
	const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
	const suffix = only ? `-${only.startedAt.slice(0, 16).replace(/\D/g, '')}` : '';
	downloadFile(`${slugify(title.value)}-stats${suffix}.csv`, csv, 'text/csv');
};

const showPlayer = async (entry: LeaderboardEntry, playersCount: number): Promise<void> => {
	try {
		answers.value = await api<PlayerAnswerDetail[]>(`/quizzes/${quizId}/players/${entry.id}`);
		selectedCount.value = playersCount;
		selected.value = entry;
	} catch (error) {
		toast.error((error as Error).message);
	}
};
</script>

<template>
	<div class="results">
		<header class="top">
			<div>
				<PillButton to="/dashboard" :label="t('dash.title')" class="back is-back">
					<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
				</PillButton>
				<h1>{{ t('results.title', { title }) }}</h1>
			</div>
			<div class="top-actions">
				<BaseButton v-if="runs.length" variant="secondary" @click="exportStats()"><AppIcon name="download" /> {{ t('results.export') }}</BaseButton>
				<BaseButton v-if="runs.some((run) => run.endedAt)" variant="danger" @click="clearing = 'all'"><AppIcon name="trash" /> {{ t('results.clear') }}</BaseButton>
			</div>
		</header>
		<p v-if="!runs.length" class="muted">{{ t('results.none') }}</p>
		<BaseCard v-for="(run, i) in runs" :key="run.id" :accent="ANSWER_COLORS[i % ANSWER_COLORS.length]">
			<div class="run-head">
				<h2>{{ new Date(run.startedAt).toLocaleString(locale) }}</h2>
				<div class="run-actions">
					<BaseButton v-if="run.players.length" variant="ghost" size="sm" @click="exportStats(run)"><AppIcon name="download" /> {{ t('results.exportRun') }}</BaseButton>
					<BaseButton v-if="run.endedAt" variant="ghost" size="sm" :aria-label="t('results.clearRun')" :title="t('results.clearRun')" @click="clearing = run"><AppIcon name="trash" /></BaseButton>
				</div>
			</div>
			<p class="muted">
				{{ tp('results.players', run.players.length) }} · {{ run.endedAt ? t('results.finished') : t('results.inProgress') }} · {{ t('results.clickHint') }}
			</p>
			<Leaderboard :entries="run.players" selectable @select="showPlayer($event, run.players.length)" />
		</BaseCard>

		<BaseModal :open="Boolean(selected)" :title="title" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selectedCount" :answers="answers" />
		</BaseModal>

		<BaseModal :open="Boolean(clearing)" :title="clearing === 'all' ? t('results.clearTitle') : t('results.clearRunTitle')" @close="clearing = null">
			<p v-if="clearing === 'all'">{{ t('results.clearText') }}</p>
			<p v-else-if="clearing">{{ t('results.clearRunText', { date: new Date(clearing.startedAt).toLocaleString(locale) }) }}</p>
			<p class="notice"><AppIcon name="warning" /> {{ t('results.clearWarning') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="clearing = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="clearStats">{{ t('results.clearConfirm') }}</BaseButton>
			</template>
		</BaseModal>
	</div>
</template>

<style scoped>
.results {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.top {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.back svg {
	width: 1.15rem;
	height: 1.15rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.6;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.run-head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}

.run-head h2 {
	margin: 0;
}

.top h1 {
	margin: 0;
}

.run-actions {
	display: flex;
	gap: 0.25rem;
}

.top-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.notice {
	padding: 0.6rem 0.8rem;
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--color-3) 20%, transparent);
	font-size: 0.9rem;
}
</style>
