<script setup lang="ts">
// Read-only question list of a quiz: library "Preview", dashboard "Get update" (`/quizzes/public/<uid>`), admin (`/admin/quizzes/<id>`, marks correct answers).
import { computed, ref, watch } from 'vue';
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

const minutes = computed(() => Math.max(1, Math.round((preview.value?.questions.reduce((sum, question) => sum + question.timeLimit, 0) ?? 0) / 60)));

</script>

<template>
	<p v-if="error" class="muted">{{ error }}</p>
	<p v-else-if="!preview" class="muted">{{ t('common.loading') }}</p>
	<div v-else class="preview">
		<ul class="facts">
			<li><AppIcon name="pencil" /> <span class="clip">{{ t('library.previewBy', { owner: preview.owner }) }}</span></li>
			<li><AppIcon name="page" /> <strong>{{ preview.questions.length }}</strong> {{ tp('dash.questions', preview.questions.length) }}</li>
			<li><AppIcon name="play" /> {{ t('library.previewDuration', { n: minutes }) }}</li>
		</ul>
		<ol class="questions">
			<li v-for="(question, questionIndex) in preview.questions" :key="questionIndex" class="question" :style="{ '--tint': ANSWER_COLORS[questionIndex % ANSWER_COLORS.length] }">
				<header class="q-head">
					<span class="q-number">{{ questionIndex + 1 }}</span>
					<strong class="q-text selectable">{{ question.text }}</strong>
				</header>
				<p class="q-meta">
					<span class="pill"><DifficultyStars :difficulty="question.difficulty" /> {{ t(`q.level.${question.difficulty}` as MessageKey) }}</span>
					<span class="pill">{{ t('report.seconds', { n: question.timeLimit }) }}</span>
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
.facts {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: 0 0 1rem;
	padding: 0;
	list-style: none;
}

.facts li {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.3rem 0.75rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: var(--surface-2);
	max-width: 100%;
	font-size: 0.9rem;
	white-space: nowrap;
}

/* A 24-char nickname without spaces is wider than a phone modal. */
.clip {
	overflow: hidden;
	text-overflow: ellipsis;
}

.facts strong {
	color: var(--accent-text);
}

.questions {
	display: grid;
	gap: 1rem;
	margin: 0;
	padding: 0 0 0.4rem;
	list-style: none;
}

.question {
	padding: 0.9rem 1rem 1rem;
	border: 2px solid color-mix(in srgb, var(--tint) 40%, var(--border));
	border-radius: var(--radius);
	background:
		radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--tint) 16%, transparent), transparent 55%),
		var(--surface-2);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--tint) 55%, black);
	animation: pop 0.3s ease backwards;
}

.q-head {
	display: flex;
	align-items: flex-start;
	gap: 0.6rem;
	overflow-wrap: anywhere;
}

.q-number {
	flex-shrink: 0;
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	border: 2px solid var(--tint);
	background: var(--surface);
	font-weight: 700;
	box-shadow: 0 0.15rem 0 color-mix(in srgb, var(--tint) 55%, black);
}

.q-text {
	padding-top: 0.2rem;
	font-size: 1.05rem;
	line-height: 1.35;
}

.q-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	margin: 0.5rem 0 0.75rem 2.6rem;
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.1rem 0.6rem;
	border-radius: 999px;
	background: var(--surface);
	color: var(--text-muted);
	font-size: 0.8rem;
	white-space: nowrap;
}

.answers {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.answers li {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	padding: 0.45rem 0.6rem;
	border: 1px solid color-mix(in srgb, var(--answer-color) 45%, var(--border));
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--answer-color) 10%, var(--surface));
	font-size: 0.92rem;
	overflow-wrap: anywhere;
}

.answers li.correct {
	outline: 2px solid var(--btn-success);
	outline-offset: 1px;
	font-weight: 600;
}

.symbol {
	flex-shrink: 0;
	display: grid;
	place-items: center;
	width: 1.7rem;
	height: 1.7rem;
	border-radius: 0.5rem;
	background: var(--answer-color);
	color: var(--on-color);
	box-shadow: 0 0.12rem 0 color-mix(in srgb, var(--answer-color) 55%, black);
}

.ok {
	flex-shrink: 0;
	margin-left: auto;
	color: var(--success);
}

@keyframes pop {
	from {
		opacity: 0;
		transform: translateY(0.4rem) scale(0.98);
	}
}

@media (max-width: 480px) {
	.q-meta {
		margin-left: 0;
	}
}
</style>
