<script setup lang="ts">
import AnswerChart from '@/views/components/game/AnswerChart.vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import DifficultyStars from '@/views/components/game/DifficultyStars.vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import type { QuestionStat } from '@/interfaces/Results/ResultsInterface';
import type { MessageKey } from '@/locales/en';
import { ANSWER_COLORS, ANSWER_ICONS, POINTS_PER_DIFFICULTY } from '@/utils/Answers';
import { t } from '@/i18n';

defineProps<{ stat: QuestionStat }>();
</script>

<template>
	<li class="question">
		<header class="q-head">
			<span class="q-number">{{ stat.index + 1 }}</span>
			<strong class="q-text selectable">{{ stat.question.text }}</strong>
		</header>
		<p class="q-meta muted">
			<DifficultyStars :difficulty="stat.question.difficulty" />
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
</template>

<style scoped>
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
</style>
