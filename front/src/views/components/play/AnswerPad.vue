<script setup lang="ts">
import AnswerGrid from '@/views/components/game/AnswerGrid.vue';
import TimerRing from '@/views/components/game/TimerRing.vue';
import { t } from '@/i18n';

defineProps<{ count: number; remainingMs: number; timeLimit: number }>();
const emit = defineEmits<{ answer: [index: number] }>();
</script>

<template>
	<section class="answering">
		<div class="timer-row">
			<TimerRing size="sm" :remaining-ms="remainingMs" :duration="timeLimit" running />
			<span class="muted">{{ t('play.pick') }}</span>
		</div>
		<AnswerGrid :count="count" @select="emit('answer', $event)" />
	</section>
</template>

<style scoped>
.answering {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.75rem;
}

.timer-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
}

.answering > :last-child {
	flex: 1;
}

@media (min-width: 900px) {
	.answering {
		width: min(100%, 56rem);
		margin: 0 auto;
	}
}
</style>
