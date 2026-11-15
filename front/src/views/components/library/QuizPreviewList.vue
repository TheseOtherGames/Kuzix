<script setup lang="ts">
// Read-only question list of a quiz: library "Preview", dashboard "Get update" (`/quizzes/public/<uid>`), admin (`/admin/quizzes/<id>`, marks correct answers).
import { ref, watch } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import DifficultyStars from '@/views/components/game/DifficultyStars.vue';
import type { QuizPreview } from '@/interfaces/Quiz/QuizInterface';
import type { MessageKey } from '@/locales/en';
import { ANSWER_COLORS, ANSWER_ICONS } from '@/utils/Answers';
import { api } from '@/utils/API';
import { t, tp } from '@/i18n';

const props = defineProps<{ url: string }>();

const preview = ref<QuizPreview | null>(null);
const error = ref('');

watch(() => props.url, async (url) => {
	preview.value = null;
	error.value = '';
	try {
		preview.value = await api<QuizPreview>(url);
	} catch (caught) {
		error.value = (caught as Error).message;
	}
}, { immediate: true });
</script>

<template>
	<p v-if="error" class="muted">{{ error }}</p>
	<p v-else-if="!preview" class="muted">{{ t('common.loading') }}</p>
	<div v-else class="preview">
		<p class="muted">{{ t('library.previewBy', { owner: preview.owner }) }} · {{ preview.questions.length }} {{ tp('dash.questions', preview.questions.length) }}</p>
		<ol class="questions">
			<li v-for="(question, questionIndex) in preview.questions" :key="questionIndex" class="question">
				<header class="q-head">
					<span class="q-number">{{ questionIndex + 1 }}</span>
					<strong class="selectable">{{ question.text }}</strong>
				</header>
				<p class="q-meta muted">
					<DifficultyStars :difficulty="question.difficulty" />
					{{ t(`q.level.${question.difficulty}` as MessageKey) }} · {{ t('report.seconds', { n: question.timeLimit }) }}
				</p>
				<ul class="answers selectable">
					<li v-for="(answer, answerIndex) in question.answers" :key="answerIndex" :class="{ correct: question.correct?.includes(answerIndex) }" :style="{ '--answer-color': ANSWER_COLORS[answerIndex] }">
						<span class="symbol"><AppIcon :name="ANSWER_ICONS[answerIndex]" /></span>
						<span class="answer-text">{{ answer }}</span>
						<AppIcon v-if="question.correct?.includes(answerIndex)" class="ok" name="check" />
					</li>
				</ul>
			</li>
		</ol>
	</div>
</template>

<style scoped>
.preview > p {
	margin: 0 0 0.75rem;
}

.questions {
	display: grid;
	gap: 0.75rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.question {
	padding: 0.75rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface-2);
}

.q-head {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	overflow-wrap: anywhere;
}

.q-number {
	flex-shrink: 0;
	min-width: 1.6rem;
	padding: 0.05rem 0.4rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--accent) 30%, var(--surface));
	font-weight: 700;
	text-align: center;
}

.q-meta {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0.35rem 0 0.6rem;
	font-size: 0.85rem;
}

.answers {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
	gap: 0.4rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.answers li {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.3rem 0.5rem;
	border-left: 4px solid var(--answer-color);
	border-radius: var(--radius-sm);
	background: var(--surface);
	font-size: 0.9rem;
	overflow-wrap: anywhere;
}

.answers li.correct {
	outline: 2px solid var(--btn-success);
	font-weight: 600;
}

.ok {
	margin-left: auto;
}

.symbol {
	display: inline-flex;
	color: var(--answer-color);
}
</style>
