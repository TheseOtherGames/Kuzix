<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '../../shared/ui/AppIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import Leaderboard, { type LeaderboardEntry } from '../../shared/ui/Leaderboard.vue';
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
	const header = [t('csv.game'), t('csv.started'), t('csv.ended'), t('csv.rank'), t('csv.nickname'), t('csv.registered'), t('csv.score')];
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
			<h1>{{ t('results.title', { title }) }}</h1>
			<BaseButton v-if="runs.length" variant="secondary" @click="exportStats()"><AppIcon name="download" /> {{ t('results.export') }}</BaseButton>
		</header>
		<p v-if="!runs.length" class="muted">{{ t('results.none') }}</p>
		<BaseCard v-for="(run, i) in runs" :key="run.id" :accent="ANSWER_COLORS[i % ANSWER_COLORS.length]">
			<div class="run-head">
				<h2>{{ new Date(run.startedAt).toLocaleString(locale) }}</h2>
				<BaseButton v-if="run.players.length" variant="ghost" size="sm" @click="exportStats(run)"><AppIcon name="download" /> {{ t('results.exportRun') }}</BaseButton>
			</div>
			<p class="muted">
				{{ tp('results.players', run.players.length) }} · {{ run.endedAt ? t('results.finished') : t('results.inProgress') }} · {{ t('results.clickHint') }}
			</p>
			<Leaderboard :entries="run.players" selectable @select="showPlayer($event, run.players.length)" />
		</BaseCard>

		<BaseModal :open="Boolean(selected)" :title="title" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selectedCount" :answers="answers" />
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
</style>
