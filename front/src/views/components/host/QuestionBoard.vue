<script setup lang="ts">
import { computed } from 'vue';
import AnswerChart from '@/views/components/game/AnswerChart.vue';
import AnswerGrid from '@/views/components/game/AnswerGrid.vue';
import TimerRing from '@/views/components/game/TimerRing.vue';
import DifficultyBadge from '@/views/components/game/DifficultyBadge.vue';
import Leaderboard from '@/views/components/game/Leaderboard.vue';
import AnswerProgress from '@/views/components/host/AnswerProgress.vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import type { HostState } from '@/interfaces/Game/GameInterface';
import { t } from '@/i18n';

const props = defineProps<{
	state: HostState;
	question: NonNullable<HostState['question']>;
	nextLabel: string;
	isLastQuestion: boolean;
}>();

const emit = defineEmits<{ next: []; cancel: [] }>();

const showReveal = computed(() => props.state.phase === 'reveal' && props.state.revealMode === 'question');
const answeredCount = computed(() => props.state.players.filter((player) => player.answered).length);
</script>

<template>
	<section class="board">
		<h1 class="question">
			{{ question.text }}
			<span v-if="question.cancelled" class="cancelled-badge"><AppIcon name="ban" /> {{ t('host.cancelledBadge') }}</span>
		</h1>

		<div class="stage">
			<div class="timer-slot">
				<TimerRing :remaining-ms="question.remainingMs" :duration="question.timeLimit" :running="state.phase === 'question'" />
				<DifficultyBadge :difficulty="question.difficulty" />
			</div>

			<div class="center-stage">
				<AnswerChart v-if="showReveal && state.reveal" :counts="state.reveal.counts" :correct="state.reveal.correct" />
				<p v-else-if="state.phase === 'reveal'" class="locked"><AppIcon name="lock" /> {{ t('host.locked') }}</p>
				<AnswerProgress v-else :answered="answeredCount" :total="state.players.length" />
			</div>

			<div class="side">
				<template v-if="state.phase === 'reveal'">
					<Leaderboard v-if="showReveal && !isLastQuestion" :entries="state.players" :limit="5" />
					<BaseButton size="lg" block @click="emit('next')">{{ nextLabel }}</BaseButton>
					<BaseButton v-if="!question.cancelled" variant="ghost" block @click="emit('cancel')"><AppIcon name="ban" /> {{ t('host.cancelQ') }}</BaseButton>
				</template>
			</div>
		</div>

		<AnswerGrid
			class="answers"
			:count="question.answers.length"
			:texts="question.answers"
			:correct="showReveal ? state.reveal?.correct : null"
			:counts="showReveal ? state.reveal?.counts : null"
			disabled
		/>
	</section>
</template>

<style scoped>
.board {
	display: grid;
	flex: 1;
	grid-template-rows: auto minmax(0, 1fr) auto;
	gap: clamp(0.75rem, 2vh, 1.5rem);
	min-height: 0;
	padding: clamp(0.5rem, 2vh, 1.5rem) clamp(0.75rem, 2.5vw, 2rem) clamp(0.75rem, 2.5vh, 2rem);
}

.question {
	margin: 0;
	padding: clamp(0.75rem, 2vh, 1.5rem) clamp(1rem, 3vw, 2.5rem);
	border-radius: calc(var(--radius) * 1.5);
	background: var(--surface);
	box-shadow: var(--shadow);
	font-size: clamp(1.6rem, 4vw, 3.6rem);
	line-height: 1.15;
	text-align: center;
	overflow-wrap: anywhere;
}

.cancelled-badge {
	display: block;
	width: fit-content;
	margin: 0.5rem auto 0;
	padding: 0.2em 0.8em;
	border-radius: 999px;
	background: var(--btn-danger);
	color: var(--on-color);
	font-size: clamp(0.9rem, 1.6vw, 1.3rem);
}

.stage {
	display: grid;
	/* Symmetric side columns keep the chart/progress centred on the screen. */
	grid-template-columns: minmax(10rem, 22rem) minmax(0, 1fr) minmax(10rem, 22rem);
	align-items: center;
	gap: clamp(0.75rem, 2vw, 2rem);
	min-height: 0;
}

.timer-slot {
	display: grid;
	place-items: center;
	gap: 0.75rem;
}

.timer-slot :deep(.timer) {
	width: clamp(6rem, 14vw, 12rem);
	height: clamp(6rem, 14vw, 12rem);
	font-size: clamp(2rem, 4.5vw, 4rem);
}

.center-stage {
	display: grid;
	place-items: center;
	height: 100%;
	min-height: 0;
	padding-block: 0.5rem;
}

.center-stage > .chart {
	width: 100%;
}

.locked {
	margin: 0;
	font-size: clamp(1.3rem, 2.6vw, 2.2rem);
	font-weight: 600;
	text-align: center;
}

.side {
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.75rem;
	min-height: 0;
	overflow: hidden;
}

.answers {
	--tile-min-height: clamp(3.5rem, 10vh, 7rem);
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: clamp(0.5rem, 1.5vh, 1rem) clamp(0.5rem, 1.5vw, 1rem);
}

.answers :deep(.tile) {
	min-height: var(--tile-min-height);
}

.answers :deep(.text) {
	font-size: clamp(1.1rem, 2.4vw, 2.1rem);
}

.answers :deep(.symbol) {
	font-size: clamp(1.6rem, 3vw, 2.6rem);
}

@media (max-width: 860px) {
	.stage {
		grid-template-columns: auto minmax(0, 1fr);
	}

	.side {
		grid-column: 1 / -1;
	}

	.answers {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
