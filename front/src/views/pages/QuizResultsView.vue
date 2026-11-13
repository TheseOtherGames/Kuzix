<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import PillButton from '@/views/components/utils/form/PillButton.vue';
import PlayerReport from '@/views/components/game/PlayerReport.vue';
import SessionBar from '@/views/components/results/SessionBar.vue';
import StatTiles from '@/views/components/results/StatTiles.vue';
import SessionsTable from '@/views/components/results/SessionsTable.vue';
import PlayersTable from '@/views/components/results/PlayersTable.vue';
import QuestionStats from '@/views/components/results/QuestionStats.vue';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import Notice from '@/views/components/utils/text/Notice.vue';
import type { PlayerAnswerDetail, Quiz, Run, RunPlayer } from '@/interfaces/Quiz/QuizInterface';
import type { AnswerMark, PlayerRow, QuestionStat, SessionSummary, StatTile } from '@/interfaces/Results/ResultsInterface';
import type { MessageKey } from '@/locales/en';
import { api } from '@/utils/API';
import { POINTS_PER_DIFFICULTY } from '@/utils/Answers';
import { downloadCsv, slugify } from '@/utils/Download';
import { locale, t } from '@/i18n';
import { toast } from '@/utils/Toast';

const route = useRoute();
const quizId = route.params.id as string;
const quiz = ref<Quiz | null>(null);
const runs = ref<Run[]>([]);
// null = every session, a run = only that one.
const scope = ref<Run | null>(null);
const selected = ref<RunPlayer | null>(null);
const selectedCount = ref(0);
const answers = ref<PlayerAnswerDetail[]>([]);
// 'all' = every finished session, a run = just that one.
const clearing = ref<Run | 'all' | null>(null);

const title = computed(() => quiz.value?.title ?? '');
const questions = computed(() => quiz.value?.questions ?? []);
const maxPoints = computed(() => questions.value.reduce((sum, question) => sum + question.difficulty * POINTS_PER_DIFFICULTY, 0));
const scopedRuns = computed(() => (scope.value ? [scope.value] : runs.value));

const sessionLabel = (run: Run): string => new Date(run.startedAt).toLocaleString(locale.value);
const runOf = new Map<number, Run>();

const percent = (part: number, total: number): string => (total ? `${Math.round((part / total) * 100)}%` : '–');
const seconds = (totalMs: number, count: number): string => (count ? t('report.seconds', { n: (totalMs / count / 1000).toFixed(1) }) : '–');

const isCorrect = (questionIndex: number, answerIndex: number): boolean => Boolean(questions.value[questionIndex]?.answers[answerIndex]?.isCorrect);

// Every player of the scope with their own totals, best score first.
const players = computed((): PlayerRow[] => scopedRuns.value
	.flatMap((run) => run.players)
	.map((player) => {
		const correct = player.answers.filter((entry) => isCorrect(entry.question, entry.answer)).length;
		const timeMs = player.answers.reduce((sum, entry) => sum + entry.timeMs, 0);
		const byQuestion = questions.value.map((_, index) => player.answers.find((entry) => entry.question === index));

		return {
			player,
			run: runOf.get(player.id)!,
			correct,
			accuracy: percent(correct, questions.value.length),
			avgTime: seconds(timeMs, player.answers.length),
			strip: byQuestion.map((entry, index): AnswerMark => (!entry ? 'none' : isCorrect(index, entry.answer) ? 'good' : 'bad')),
		};
	})
	.sort((a, b) => b.player.score - a.player.score)
	// One session keeps its real (tie-aware) rank; across sessions the place in this list is the rank.
	.map((row, index) => ({ ...row, rank: scope.value ? row.player.rank : index + 1 })));

const ratio = (part: number, total: number): number | null => (total ? part / total : null);

const overview = computed(() => {
	const list = players.value;
	const given = list.reduce((sum, row) => sum + row.player.answers.length, 0);
	const slots = list.length * questions.value.length;
	const correct = list.reduce((sum, row) => sum + row.correct, 0);
	const timeMs = list.reduce((sum, row) => sum + row.player.answers.reduce((total, entry) => total + entry.timeMs, 0), 0);
	const avgScore = list.length ? Math.round(list.reduce((sum, row) => sum + row.player.score, 0) / list.length) : 0;
	const best = list[0]?.player.score;
	const outOf = `/ ${maxPoints.value}`;
	const tiles: Omit<StatTile, 'label' | 'info'>[] = [
		{
			key: 'sessions', icon: 'play', color: 'var(--color-1)', value: String(scopedRuns.value.length),
		},
		{
			key: 'players', icon: 'players', color: 'var(--color-2)', value: String(list.length),
		},
		{
			key: 'avgScore', icon: 'chart', color: 'var(--color-5)', value: String(avgScore), unit: outOf, ratio: ratio(avgScore, maxPoints.value),
		},
		{
			key: 'bestScore', icon: 'trophy', color: 'var(--color-3)', value: String(best ?? '–'), unit: best === undefined ? '' : outOf, ratio: ratio(best ?? 0, maxPoints.value),
		},
		{
			key: 'accuracy', icon: 'check', color: 'var(--color-4)', value: percent(correct, slots), ratio: ratio(correct, slots),
		},
		{
			key: 'answerRate', icon: 'signal', color: 'var(--color-6)', value: percent(given, slots), ratio: ratio(given, slots),
		},
		{
			key: 'avgTime', icon: 'pause', color: 'var(--color-2)', value: seconds(timeMs, given),
		},
	];

	// One session: the session count is always 1, so it is left out.
	return tiles.filter((tile) => !scope.value || tile.key !== 'sessions').map((tile) => ({ ...tile, label: t(`results.stat.${tile.key}` as MessageKey), info: t(`results.info.${tile.key}` as MessageKey) }));
});

// Per question: how many picked each answer, accuracy, time, skips.
const questionStats = computed((): QuestionStat[] => {
	const list = players.value;

	return questions.value.map((question, index) => {
		const given = list.flatMap((row) => row.player.answers.filter((entry) => entry.question === index));
		const counts = question.answers.map((_, answerIndex) => given.filter((entry) => entry.answer === answerIndex).length);
		const correctIndexes = question.answers.flatMap((answer, answerIndex) => (answer.isCorrect ? [answerIndex] : []));
		const correct = given.filter((entry) => correctIndexes.includes(entry.answer)).length;

		return {
			question,
			index,
			counts,
			correctIndexes,
			accuracy: percent(correct, list.length),
			avgTime: seconds(given.reduce((sum, entry) => sum + entry.timeMs, 0), given.length),
			skipped: list.length - given.length,
			avgPoints: list.length ? Math.round(given.reduce((sum, entry) => sum + entry.points, 0) / list.length) : 0,
		};
	});
});

const sessions = computed(() => runs.value.map((run): SessionSummary => {
	const best = run.players.reduce<RunPlayer | null>((top, player) => (!top || player.score > top.score ? player : top), null);
	const avg = run.players.length ? Math.round(run.players.reduce((sum, player) => sum + player.score, 0) / run.players.length) : 0;

	return { run, best, avg };
}));

const clearStats = async (): Promise<void> => {
	const target = clearing.value;
	try {
		await api(target === 'all' ? `/quizzes/${quizId}/runs` : `/quizzes/${quizId}/runs/${target!.id}`, 'DELETE');
		runs.value = runs.value.filter((run) => target === 'all' ? !run.endedAt : run !== target);
		if (scope.value && !runs.value.includes(scope.value)) {
			scope.value = runs.value[0] ?? null;
		}
		clearing.value = null;
		toast.success(t('results.cleared'));
	} catch (error) {
		toast.error((error as Error).message);
	}
};

onMounted(async () => {
	try {
		const [loaded, list] = await Promise.all([api<Quiz>(`/quizzes/${quizId}`), api<Run[]>(`/quizzes/${quizId}/runs`)]);
		list.forEach((run) => run.players.forEach((player) => runOf.set(player.id, run)));
		quiz.value = loaded;
		runs.value = list;
		// Runs come newest first: open on the latest session.
		scope.value = runs.value[0] ?? null;
	} catch (error) {
		toast.error((error as Error).message);
	}
});

const download = (name: string, rows: (string | number | boolean | null)[][]): void => downloadCsv(`${slugify(title.value)}-${name}.csv`, rows);

// No run = every session; a run = only that session's players.
const exportStats = (only?: Run): void => {
	const header = [
		t('csv.game'),
		t('csv.started'),
		t('csv.ended'),
		t('csv.rank'),
		t('csv.nickname'),
		t('csv.score'),
		t('csv.correct'),
		t('csv.avgTime'),
	];
	const rows = runs.value.flatMap((run, runIndex) => (only && run !== only ? [] : run.players).map((player) => [
		runs.value.length - runIndex,
		run.startedAt,
		run.endedAt,
		player.rank,
		player.nickname,
		player.score,
		player.answers.filter((entry) => isCorrect(entry.question, entry.answer)).length,
		player.answers.length ? (player.answers.reduce((sum, entry) => sum + entry.timeMs, 0) / player.answers.length / 1000).toFixed(1) : '',
	]));
	const suffix = only ? sessionSuffix(only) : '';
	download(`stats${suffix}`, [header, ...rows]);
};

const sessionSuffix = (run: Run): string => `-${run.startedAt.slice(0, 16).replace(/\D/g, '')}`;

// One session, spreadsheet-friendly: one row per player, one column per question (Q1, Q2…) holding the answer they picked.
const exportAnswers = (run: Run): void => {
	const header = [
		t('csv.rank'),
		t('csv.nickname'),
		t('csv.score'),
		...questions.value.map((_, index) => `Q${index + 1}`),
	];
	const rows = run.players.map((player) => [
		player.rank,
		player.nickname,
		player.score,
		...questions.value.map((question, index) => {
			const entry = player.answers.find((answer) => answer.question === index);

			return entry ? question.answers[entry.answer]?.text ?? '' : t('common.noAnswer');
		}),
	]);
	download(`answers${sessionSuffix(run)}`, [header, ...rows]);
};

const showPlayer = async (player: RunPlayer): Promise<void> => {
	try {
		answers.value = await api<PlayerAnswerDetail[]>(`/quizzes/${quizId}/players/${player.id}`);
		selectedCount.value = runOf.get(player.id)?.players.length ?? 0;
		selected.value = player;
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

		<template v-else>
			<SessionBar v-model="scope" :runs="runs" :label="sessionLabel" @export-stats="exportStats" @export-answers="exportAnswers" @clear="clearing = $event" />
			<StatTiles :tiles="overview" />
			<SessionsTable
				v-if="!scope"
				:sessions="sessions"
				:label="sessionLabel"
				@pick="scope = $event"
				@export-stats="exportStats"
				@export-answers="exportAnswers"
				@clear="clearing = $event"
			/>
			<PlayersTable :rows="players" :questions="questions" :show-session="!scope" :label="sessionLabel" @show="showPlayer" />
			<QuestionStats :stats="questionStats" />
		</template>

		<BaseModal :open="Boolean(selected)" :title="title" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selectedCount" :answers="answers" />
		</BaseModal>

		<ConfirmModal
			:open="Boolean(clearing)"
			:title="clearing === 'all' ? t('results.clearTitle') : t('results.clearRunTitle')"
			:confirm-label="t('results.clearConfirm')"
			@close="clearing = null"
			@confirm="clearStats"
		>
			<p v-if="clearing === 'all'">{{ t('results.clearText') }}</p>
			<p v-else-if="clearing">{{ t('results.clearRunText', { date: sessionLabel(clearing) }) }}</p>
			<Notice>{{ t('results.clearWarning') }}</Notice>
		</ConfirmModal>
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

.top h1 {
	margin: 0;
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

.top-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}
</style>
