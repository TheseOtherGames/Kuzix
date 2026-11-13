<script setup lang="ts">
import type { QuestionDraft } from '@/features/quiz/quiz.types';
import { ANSWER_COLORS, ANSWER_ICONS, MAX_ANSWERS, MIN_ANSWERS, POINTS_PER_DIFFICULTY } from '@/shared/answers';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import InfoTip from '@/shared/ui/InfoTip.vue';
import type { MessageKey } from '@/shared/i18n/en';
import { t } from '@/shared/i18n/i18n';

defineProps<{
	index: number;
	total: number;
	colorIndex: number;
}>();

const emit = defineEmits<{
	remove: [];
	move: [offset: number];
}>();

const question = defineModel<QuestionDraft>({ required: true });

const addAnswer = (): void => {
	question.value.answers.push({ text: '', isCorrect: false });
};

const removeAnswer = (index: number): void => {
	question.value.answers.splice(index, 1);
};
</script>

<template>
	<BaseCard :accent="ANSWER_COLORS[colorIndex % ANSWER_COLORS.length]">
		<header class="header">
			<h3>{{ t('q.title', { n: index + 1 }) }}</h3>
			<div class="tools">
				<div class="mover" role="group">
					<button
						type="button"
						class="move"
						:disabled="index === 0"
						:title="t('q.moveUp')"
						:aria-label="t('q.moveUp')"
						@click="emit('move', -1)"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
					</button>
					<button
						type="button"
						class="move"
						:disabled="index === total - 1"
						:title="t('q.moveDown')"
						:aria-label="t('q.moveDown')"
						@click="emit('move', 1)"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
					</button>
				</div>
				<BaseButton variant="danger" size="sm" :disabled="total === 1" @click="emit('remove')"><AppIcon name="trash" /> {{ t('q.delete') }}</BaseButton>
			</div>
		</header>

		<label>
			{{ t('q.question') }}<InfoTip :text="t('q.questionInfo')" />
			<textarea v-model="question.text" rows="2" maxlength="300" required :placeholder="t('q.placeholder')"></textarea>
		</label>

		<div class="settings">
			<label>
				{{ t('q.time') }}<InfoTip :text="t('q.timeInfo')" />
				<input v-model.number="question.timeLimit" type="number" min="5" max="120" required />
			</label>
			<label>
				{{ t('q.difficulty') }}<InfoTip :text="t('q.difficultyInfo')" />
				<select v-model.number="question.difficulty">
					<option v-for="level in 5" :key="level" :value="level">
						{{ t('q.difficultyOption', { level, label: t(`q.level.${level}` as MessageKey), pts: level * POINTS_PER_DIFFICULTY }) }}
					</option>
				</select>
			</label>
		</div>

		<fieldset class="answers">
			<legend>{{ t('q.answers') }} <span class="muted">{{ t('q.answersHint') }}</span><InfoTip :text="t('q.answersInfo')" /></legend>
			<div
				v-for="(answer, answerIndex) in question.answers"
				:key="answerIndex"
				class="answer"
				:class="{ right: answer.isCorrect }"
				:style="{ '--answer-color': ANSWER_COLORS[answerIndex] }"
			>
				<span class="symbol"><AppIcon :name="ANSWER_ICONS[answerIndex]" /></span>
				<input v-model="answer.text" maxlength="120" required :placeholder="t('q.answerPh', { n: answerIndex + 1 })" />
				<button
					type="button"
					class="correct"
					:aria-pressed="answer.isCorrect"
					:title="answer.isCorrect ? t('q.markWrong') : t('q.markCorrect')"
					@click="answer.isCorrect = !answer.isCorrect"
				>
					<AppIcon :name="answer.isCorrect ? 'check' : 'cross'" /> {{ answer.isCorrect ? t('q.correct') : t('q.wrong') }}
				</button>
				<button
					type="button"
					class="remove"
					:disabled="question.answers.length <= MIN_ANSWERS"
					:aria-label="t('q.removeAnswer')"
					@click="removeAnswer(answerIndex)"
				>
					✕
				</button>
			</div>
			<BaseButton v-if="question.answers.length < MAX_ANSWERS" variant="ghost" size="sm" @click="addAnswer"><AppIcon name="plus" /> {{ t('q.addAnswer') }}</BaseButton>
		</fieldset>
	</BaseCard>
</template>

<style scoped>
.header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
}

.header h3 {
	margin: 0;
}

.mover {
	display: inline-flex;
	overflow: hidden;
	border-radius: 999px;
	background: var(--surface-2);
	box-shadow: inset 0 0 0 2px var(--border), 0 0.2rem 0 color-mix(in srgb, var(--surface-2) 55%, black);
}

.move {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2rem;
	padding: 0;
	border: none;
	background: none;
	color: var(--text);
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.move + .move {
	border-left: 2px solid var(--border);
}

.move svg {
	width: 1.2rem;
	height: 1.2rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 3;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: transform 0.15s;
}

.move:hover:not(:disabled) {
	background: var(--accent);
	color: var(--on-accent);
}

.move:first-child:hover:not(:disabled) svg {
	transform: translateY(-0.15rem);
}

.move:last-child:hover:not(:disabled) svg {
	transform: translateY(0.15rem);
}

.move:disabled {
	opacity: 0.3;
	cursor: not-allowed;
}

.tools {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.settings {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
	gap: 1rem;
	margin-top: 1rem;
}

.answers {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.6rem;
	margin: 1rem 0 0;
	padding: 0;
	border: none;
}

legend {
	margin-bottom: 0.5rem;
	font-weight: 500;
}

.answer {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.35rem;
	border-radius: var(--radius-sm);
	background: var(--answer-color);
}

.answer > input {
	flex: 1;
	border-color: transparent;
	background: var(--surface);
}

.symbol {
	width: 2rem;
	color: var(--on-color);
	font-size: 1.3rem;
	text-align: center;
}

.answer:not(.right) {
	background: color-mix(in srgb, var(--answer-color) 45%, var(--surface-2));
}

.correct {
	flex-shrink: 0;
	min-width: 6.5rem;
	padding: 0.45rem 0.8rem;
	border: 2px solid transparent;
	border-radius: 999px;
	background: var(--surface);
	color: var(--text-muted);
	font-weight: 600;
	cursor: pointer;
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--surface) 55%, black);
	transition: transform 0.15s, background 0.15s;
}

.correct:hover {
	transform: translateY(-0.1rem);
}

.correct:active {
	transform: translateY(0.15rem);
	box-shadow: none;
}

.correct[aria-pressed='true'] {
	background: var(--success);
	color: var(--on-color);
	border-color: var(--on-color);
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--success) 55%, black);
	animation: pop 0.25s;
}

@keyframes pop {
	50% {
		transform: scale(1.12);
	}
}

@media (max-width: 480px) {
	.correct {
		min-width: 0;
		font-size: 0.85rem;
	}
}

.remove {
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border: none;
	border-radius: 50%;
	background: none;
	color: var(--on-color);
	font-size: 1.1rem;
	cursor: pointer;
	transition: background 0.15s, transform 0.15s;
}

.remove:hover:not(:disabled) {
	background: color-mix(in srgb, black 25%, transparent);
	transform: rotate(90deg);
}

.remove:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
</style>
