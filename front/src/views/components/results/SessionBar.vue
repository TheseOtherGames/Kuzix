<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import type { Run } from '@/interfaces/Quiz/QuizInterface';
import { t, tp } from '@/i18n';

defineProps<{
	runs: Run[];
	label: (run: Run) => string;
}>();

// null = every session.
const scope = defineModel<Run | null>({ required: true });
const emit = defineEmits<{ exportStats: [run: Run]; exportAnswers: [run: Run]; clear: [run: Run] }>();
</script>

<template>
	<section class="session-bar">
		<div class="session-pick">
			<span class="bubble" aria-hidden="true"><AppIcon name="play" /></span>
			<div class="pick-field">
				<label class="pick-label" for="results-scope">{{ t('results.scope') }}</label>
				<select id="results-scope" v-model="scope">
					<option v-for="run in runs" :key="run.id" :value="run">
						{{ label(run) }} · {{ tp('results.players', run.players.length) }}{{ run.endedAt ? '' : ` · ${t('results.inProgress')}` }}
					</option>
					<option :value="null">{{ t('results.allSessions') }} ({{ runs.length }})</option>
				</select>
			</div>
		</div>
		<div v-if="scope" class="session-actions">
			<BaseButton v-if="scope.players.length" variant="tool" @click="emit('exportStats', scope)"><AppIcon name="download" />{{ t('results.exportRun') }}</BaseButton>
			<BaseButton v-if="scope.players.length" variant="tool" @click="emit('exportAnswers', scope)"><AppIcon name="page" />{{ t('results.exportAnswers') }}</BaseButton>
			<BaseButton v-if="scope.endedAt" variant="tool-danger" @click="emit('clear', scope)"><AppIcon name="trash" />{{ t('results.clearRun') }}</BaseButton>
		</div>
	</section>
</template>

<style scoped>
/* Picker on the left, tool tiles on the right; stacks on phones. */
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
</style>
