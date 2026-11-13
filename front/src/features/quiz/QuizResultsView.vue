<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AnswerChart from '@/features/game/AnswerChart.vue';
import AppIcon from '@/shared/ui/AppIcon.vue';
import AvatarIcon from '@/shared/ui/AvatarIcon.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import InfoTip from '@/shared/ui/InfoTip.vue';
import NameTag from '@/shared/ui/NameTag.vue';
import PillButton from '@/shared/ui/PillButton.vue';
import PlayerReport from '@/shared/ui/PlayerReport.vue';
import type { PlayerAnswerDetail, Quiz, Run, RunPlayer } from '@/features/quiz/quiz.types';
import type { MessageKey } from '@/shared/i18n/en';
import { api } from '@/shared/api';
import { ANSWER_COLORS, ANSWER_ICONS, POINTS_PER_DIFFICULTY } from '@/shared/answers';
import { downloadFile, slugify } from '@/shared/download';
import { locale, t, tp } from '@/shared/i18n/i18n';
import { toast } from '@/shared/toast.store';

const MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'];

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
const players = computed(() => scopedRuns.value
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
			strip: byQuestion.map((entry, index) => (!entry ? 'none' : isCorrect(index, entry.answer) ? 'good' : 'bad')),
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
	const tiles: { key: string; icon: string; color: string; value: string; unit?: string; ratio?: number | null }[] = [
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
const questionStats = computed(() => {
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

const sessions = computed(() => runs.value.map((run) => {
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

// Quotes every cell and defuses spreadsheet formulas, since nicknames come from players.
const csvCell = (value: string | number | boolean | null): string => {
	const text = String(value ?? '');

	return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
};

const downloadCsv = (name: string, rows: (string | number | boolean | null)[][]): void => {
	downloadFile(`${slugify(title.value)}-${name}.csv`, rows.map((row) => row.map(csvCell).join(',')).join('\r\n'), 'text/csv');
};

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
	downloadCsv(`stats${suffix}`, [header, ...rows]);
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
	downloadCsv(`answers${sessionSuffix(run)}`, [header, ...rows]);
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
			<section class="session-bar">
				<div class="session-pick">
					<span class="bubble" aria-hidden="true"><AppIcon name="play" /></span>
					<div class="pick-field">
						<label class="pick-label" for="results-scope">{{ t('results.scope') }}</label>
						<select id="results-scope" v-model="scope">
							<option v-for="run in runs" :key="run.id" :value="run">
								{{ sessionLabel(run) }} · {{ tp('results.players', run.players.length) }}{{ run.endedAt ? '' : ` · ${t('results.inProgress')}` }}
							</option>
							<option :value="null">{{ t('results.allSessions') }} ({{ runs.length }})</option>
						</select>
					</div>
				</div>
				<div v-if="scope" class="session-actions">
					<BaseButton v-if="scope.players.length" variant="tool" @click="exportStats(scope)"><AppIcon name="download" />{{ t('results.exportRun') }}</BaseButton>
					<BaseButton v-if="scope.players.length" variant="tool" @click="exportAnswers(scope)"><AppIcon name="page" />{{ t('results.exportAnswers') }}</BaseButton>
					<BaseButton v-if="scope.endedAt" variant="tool-danger" @click="clearing = scope"><AppIcon name="trash" />{{ t('results.clearRun') }}</BaseButton>
				</div>
			</section>

			<section class="tiles" :aria-label="t('results.overview')">
				<div v-for="tile in overview" :key="tile.key" class="tile" :style="{ '--tile-color': tile.color }">
					<span class="tile-icon" aria-hidden="true"><AppIcon :name="tile.icon" /></span>
					<div class="tile-body">
						<span class="tile-label">{{ tile.label }} <InfoTip :text="tile.info" /></span>
						<span class="tile-value">{{ tile.value }} <small v-if="tile.unit">{{ tile.unit }}</small></span>
						<span v-if="tile.ratio != null" class="meter" aria-hidden="true"><span :style="{ width: `${tile.ratio * 100}%` }"></span></span>
					</div>
				</div>
			</section>

			<BaseCard v-if="!scope" accent="var(--color-1)">
				<h2><AppIcon name="play" /> {{ t('results.sessions') }}</h2>
				<div class="table-scroll">
					<table>
						<thead>
							<tr>
								<th>{{ t('csv.started') }}</th>
								<th>{{ t('results.col.status') }}</th>
								<th class="num">{{ t('results.stat.players') }}</th>
								<th class="num">{{ t('results.col.avgScore') }}</th>
								<th>{{ t('results.col.winner') }}</th>
								<th><span class="sr-only">{{ t('results.col.actions') }}</span></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="session in sessions" :key="session.run.id">
								<td class="nowrap"><button type="button" class="link" @click="scope = session.run">{{ sessionLabel(session.run) }}</button></td>
								<td>{{ session.run.endedAt ? t('results.finished') : t('results.inProgress') }}</td>
								<td class="num">{{ session.run.players.length }}</td>
								<td class="num">{{ session.avg }}</td>
								<td>
									<span v-if="session.best" class="who"><AvatarIcon :value="session.best.avatar" /><NameTag :name="session.best.nickname" :look="session.best.avatar" /></span>
									<span v-else class="muted">–</span>
								</td>
								<td class="row-actions">
									<BaseButton v-if="session.run.players.length" variant="tool" :aria-label="t('results.exportRun')" @click="exportStats(session.run)"><AppIcon name="download" /></BaseButton>
									<BaseButton v-if="session.run.players.length" variant="tool" :aria-label="t('results.exportAnswers')" @click="exportAnswers(session.run)"><AppIcon name="page" /></BaseButton>
									<BaseButton v-if="session.run.endedAt" variant="tool-danger" :aria-label="t('results.clearRun')" @click="clearing = session.run"><AppIcon name="trash" /></BaseButton>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</BaseCard>

			<BaseCard accent="var(--color-2)">
				<h2><AppIcon name="players" /> {{ t('results.playersTitle') }}</h2>
				<p class="muted">{{ t('results.clickHint') }}</p>
				<p v-if="!players.length" class="muted">{{ t('common.noPlayers') }}</p>
				<div v-else class="table-scroll">
					<table>
						<thead>
							<tr>
								<th class="num">{{ t('csv.rank') }}</th>
								<th>{{ t('csv.nickname') }}</th>
								<th v-if="!scope">{{ t('csv.game') }}</th>
								<th class="num">{{ t('csv.score') }}</th>
								<th class="num">{{ t('report.correct') }}</th>
								<th class="num">{{ t('report.accuracy') }}</th>
								<th class="num">{{ t('report.avgTime') }}</th>
								<th>{{ t('results.col.answers') }}</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="row in players" :key="row.player.id" class="player-row" @click="showPlayer(row.player)">
								<td class="num">
									<span class="rank"><AppIcon v-if="row.rank && MEDALS[row.rank - 1]" :name="MEDALS[row.rank - 1]" /> {{ row.rank ?? '–' }}</span>
								</td>
								<td>
									<button type="button" class="who link" @click.stop="showPlayer(row.player)">
										<AvatarIcon :value="row.player.avatar" /><NameTag :name="row.player.nickname" :look="row.player.avatar" />
									</button>
								</td>
								<td v-if="!scope" class="muted nowrap">{{ sessionLabel(row.run) }}</td>
								<td class="num strong">{{ row.player.score }}</td>
								<td class="num">{{ row.correct }}/{{ questions.length }}</td>
								<td class="num">{{ row.accuracy }}</td>
								<td class="num">{{ row.avgTime }}</td>
								<td>
									<span class="strip" role="img" :aria-label="t('report.timeline')">
										<span v-for="(state, q) in row.strip" :key="q" class="segment" :class="state" :title="`${q + 1}. ${questions[q]?.text}`"></span>
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</BaseCard>

			<BaseCard accent="var(--color-4)">
				<h2><AppIcon name="chart" /> {{ t('results.questionsTitle') }}</h2>
				<ol class="questions">
					<li v-for="stat in questionStats" :key="stat.index" class="question">
						<header class="q-head">
							<span class="q-number">{{ stat.index + 1 }}</span>
							<strong class="q-text selectable">{{ stat.question.text }}</strong>
						</header>
						<p class="q-meta muted">
							<span class="stars" aria-hidden="true"><span v-for="star in 5" :key="star" :class="{ on: star <= stat.question.difficulty }">★</span></span>
							{{ t(`q.level.${stat.question.difficulty}` as MessageKey) }} · {{ t('common.pts', { n: stat.question.difficulty * POINTS_PER_DIFFICULTY }) }} · {{ t('report.seconds', { n: stat.question.timeLimit }) }}
						</p>
						<div class="q-body">
							<div class="q-chart"><AnswerChart :counts="stat.counts" :correct="stat.correctIndexes" /></div>
							<div class="q-side">
								<dl class="q-stats">
									<div><dt>{{ t('report.accuracy') }} <InfoTip :text="t('results.info.qAccuracy')" /></dt><dd>{{ stat.accuracy }}</dd></div>
									<div><dt>{{ t('report.avgTime') }} <InfoTip :text="t('results.info.avgTime')" /></dt><dd>{{ stat.avgTime }}</dd></div>
									<div><dt>{{ t('results.stat.avgPoints') }} <InfoTip :text="t('results.info.avgPoints')" /></dt><dd>{{ stat.avgPoints }}</dd></div>
									<div><dt>{{ t('common.noAnswer') }} <InfoTip :text="t('results.info.skipped')" /></dt><dd>{{ stat.skipped }}</dd></div>
								</dl>
								<ul class="q-answers selectable">
									<li v-for="(answer, answerIndex) in stat.question.answers" :key="answerIndex" :class="{ correct: answer.isCorrect }" :style="{ '--answer-color': ANSWER_COLORS[answerIndex] }">
										<span class="symbol"><AppIcon :name="ANSWER_ICONS[answerIndex]" /></span>
										<span class="answer-text">{{ answer.text }}</span>
										<AppIcon v-if="answer.isCorrect" class="ok" name="check" />
										<span class="answer-count">{{ stat.counts[answerIndex] }}</span>
									</li>
								</ul>
							</div>
						</div>
					</li>
				</ol>
			</BaseCard>
		</template>

		<BaseModal :open="Boolean(selected)" :title="title" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selectedCount" :answers="answers" />
		</BaseModal>

		<BaseModal :open="Boolean(clearing)" :title="clearing === 'all' ? t('results.clearTitle') : t('results.clearRunTitle')" @close="clearing = null">
			<p v-if="clearing === 'all'">{{ t('results.clearText') }}</p>
			<p v-else-if="clearing">{{ t('results.clearRunText', { date: sessionLabel(clearing) }) }}</p>
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

.top h1,
h2 {
	margin: 0;
}

h2 {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin-bottom: 0.5rem;
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

/* Session panel: picker on the left, tool tiles on the right; stacks on phones. */
.session-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: space-between;
	gap: 0.75rem 1.25rem;
	padding: 0.9rem 1rem;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.session-pick {
	display: flex;
	flex: 1 1 18rem;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
}

.bubble {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-1) 22%, var(--surface));
	color: var(--color-1);
	font-size: 1.3rem;
}

.pick-field {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.2rem;
	min-width: 0;
}

.pick-label {
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.pick-field select {
	max-width: 26rem;
	cursor: pointer;
}

.session-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* Whole buttons wrap to the next row; their label never does. */
.session-actions > * {
	flex: 1 1 auto;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
	gap: 0.85rem;
}

.tile {
	display: flex;
	align-items: center;
	gap: 0.8rem;
	padding: 0.85rem 1rem;
	border: 2px solid color-mix(in srgb, var(--tile-color) 35%, var(--border));
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--tile-color) 55%, black);
}

.tile-icon {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tile-color) 22%, var(--surface));
	color: var(--tile-color);
	font-size: 1.4rem;
}

.tile-body {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.15rem;
	min-width: 0;
}

.tile-label {
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.tile-value {
	font-size: 1.6rem;
	font-weight: 700;
	line-height: 1.1;
	font-variant-numeric: tabular-nums;
}

.tile-value small {
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 500;
}

.meter {
	height: 0.35rem;
	margin-top: 0.2rem;
	overflow: hidden;
	border-radius: 999px;
	background: var(--surface-2);
}

.meter span {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: var(--tile-color);
}

@media (max-width: 560px) {
	.tiles {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.tile {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.7rem;
	}

	.tile-body {
		width: 100%;
	}

	.tile-icon {
		width: 2.2rem;
		height: 2.2rem;
		font-size: 1.1rem;
	}

	.tile-value {
		font-size: 1.3rem;
	}
}

.table-scroll {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
}

th {
	padding: 0.4rem 0.6rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	text-align: left;
	text-transform: uppercase;
	white-space: nowrap;
}

td {
	padding: 0.5rem 0.6rem;
	border-top: 1px solid var(--border);
	vertical-align: middle;
}

.num {
	text-align: right;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.nowrap {
	white-space: nowrap;
}

.strong {
	color: var(--success);
	font-weight: 700;
}

.player-row {
	cursor: pointer;
	transition: background 0.15s;
}

.player-row:hover {
	background: var(--surface-2);
}

.rank {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-weight: 700;
}

.who {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	min-width: 0;
	font-size: 1.1rem;
}

.link {
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	cursor: pointer;
}

.link:hover {
	color: var(--accent-text);
}

.link:focus-visible {
	outline: 3px solid var(--focus-ring);
	outline-offset: 2px;
	border-radius: var(--radius-sm);
}

.row-actions {
	white-space: nowrap;
}

.row-actions > * + * {
	margin-left: 0.35rem;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
}

.strip {
	display: flex;
	gap: 0.15rem;
	min-width: 6rem;
	height: 0.55rem;
}

.segment {
	flex: 1;
	border-radius: 999px;
	background: var(--border);
}

.segment.good {
	background: var(--success);
}

.segment.bad {
	background: var(--danger);
}

.questions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.question {
	padding: 1rem;
	border-radius: var(--radius-sm);
	background: var(--surface-2);
}

.q-head {
	display: flex;
	align-items: flex-start;
	gap: 0.6rem;
}

.q-number {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-accent);
	font-weight: 700;
}

.q-text {
	font-size: 1.1rem;
	overflow-wrap: anywhere;
}

.q-meta {
	margin: 0.3rem 0 0.75rem 2.5rem;
	font-size: 0.85rem;
}

.stars {
	color: var(--border);
}

.stars .on {
	color: var(--color-3);
}

.q-body {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
	gap: 1rem;
	align-items: start;
}

.q-chart {
	min-height: 11rem;
}

.q-side {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.q-stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.5rem;
	margin: 0;
}

.q-stats div {
	padding: 0.4rem 0.6rem;
	border-radius: var(--radius-sm);
	background: var(--surface);
}

.q-stats dt {
	color: var(--text-muted);
	font-size: 0.75rem;
}

.q-stats dd {
	margin: 0;
	font-size: 1.15rem;
	font-weight: 700;
}

.q-answers {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.q-answers li {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.35rem 0.6rem;
	border-left: 0.3rem solid var(--answer-color);
	border-radius: var(--radius-sm);
	background: var(--surface);
	opacity: 0.75;
}

.q-answers li.correct {
	opacity: 1;
	font-weight: 600;
}

.symbol {
	color: var(--answer-color);
}

.answer-text {
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
}

.ok {
	color: var(--success);
}

.answer-count {
	font-variant-numeric: tabular-nums;
	font-weight: 700;
}

.notice {
	padding: 0.6rem 0.8rem;
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--color-3) 20%, transparent);
	font-size: 0.9rem;
}
</style>
