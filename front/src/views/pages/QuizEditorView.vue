<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import LeaveModal from '@/views/components/utils/modal/LeaveModal.vue';
import QuestionEditor from '@/views/components/quiz/QuestionEditor.vue';
import QuizSettingsCard from '@/views/components/quiz/QuizSettingsCard.vue';
import EditorActions from '@/views/components/quiz/EditorActions.vue';
import type { Quiz, QuizDraft, QuestionDraft } from '@/interfaces/Quiz/QuizInterface';
import { api } from '@/utils/API';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';
import { auth } from '@/utils/Auth';

const DEFAULT_ANSWERS = 4;

const route = useRoute();
const router = useRouter();
const quizId = route.params.id as string | undefined;
const saving = ref(false);
const hasAnswers = ref(false);
const warning = ref(false);
const removing = ref<number | null>(null);
const questionsList = ref<HTMLElement | null>(null);

const newQuestion = (): QuestionDraft => ({
	text: '',
	timeLimit: 20,
	difficulty: 2,
	answers: Array.from({ length: DEFAULT_ANSWERS }, (_, answerIndex) => ({ text: '', isCorrect: answerIndex === 0 })),
});

const quiz = ref<QuizDraft>({
	title: '', revealMode: 'question', countdown: 3, questions: [newQuestion()],
});

// Unsaved-changes workflow: compare against a JSON snapshot of the last loaded/saved state.
const savedState = ref(JSON.stringify(quiz.value));
const dirty = computed(() => JSON.stringify(quiz.value) !== savedState.value);
const pendingLeave = ref<RouteLocationNormalized | null>(null);
// Where to go after a successful save ("Save and leave" target, else the dashboard).
let afterSave = '/dashboard';

const undo = (): void => {
	quiz.value = JSON.parse(savedState.value);
};

onBeforeRouteLeave((to) => {
	if (!dirty.value) {
		return true;
	}
	pendingLeave.value = to;

	return false;
});

const leave = (withSave: boolean): void => {
	const to = pendingLeave.value!.fullPath;
	pendingLeave.value = null;
	if (withSave) {
		afterSave = to;
		save();

		return;
	}
	undo();
	router.push(to);
};

const onBeforeUnload = (event: BeforeUnloadEvent): void => {
	if (dirty.value) {
		event.preventDefault();
	}
};
window.addEventListener('beforeunload', onBeforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload));

// Client-only identity per question: stable v-for key and colour, so a moved question keeps its colour.
const questionIds = new WeakMap<QuestionDraft, number>();
let nextQuestionId = 0;
const idOf = (question: QuestionDraft): number => {
	const raw = toRaw(question);
	if (!questionIds.has(raw)) {
		questionIds.set(raw, nextQuestionId++);
	}

	return questionIds.get(raw)!;
};

onMounted(async () => {
	if (!quizId) {
		return;
	}
	try {
		const loaded = await api<Quiz>(`/quizzes/${quizId}`);
		nextQuestionId = 0;
		quiz.value = {
			title: loaded.title, revealMode: loaded.revealMode, countdown: loaded.countdown, questions: loaded.questions,
		};
		hasAnswers.value = loaded.hasAnswers;
		savedState.value = JSON.stringify(quiz.value);
	} catch (error) {
		toast.error((error as Error).message);
		router.replace('/dashboard');
	}
});

const moveQuestion = async (index: number, offset: number): Promise<void> => {
	const [question] = quiz.value.questions.splice(index, 1);
	quiz.value.questions.splice(index + offset, 0, question);
	await nextTick();
	questionsList.value?.querySelector(`[data-question="${idOf(question)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

const isFilled = (question: QuestionDraft): boolean => {
	return Boolean(question.text.trim()) || question.answers.some((answer) => answer.text.trim());
};

const requestRemove = (index: number): void => {
	if (isFilled(quiz.value.questions[index])) {
		removing.value = index;
	} else {
		quiz.value.questions.splice(index, 1);
	}
};

const confirmRemove = (): void => {
	quiz.value.questions.splice(removing.value!, 1);
	removing.value = null;
};

const addQuestion = async (): Promise<void> => {
	quiz.value.questions.push(newQuestion());
	await nextTick();
	questionsList.value?.firstElementChild?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const save = async (confirmed = false): Promise<void> => {
	const missing = quiz.value.questions.findIndex((question) => !question.answers.some((answer) => answer.isCorrect));
	if (missing !== -1) {
		toast.error(t('editor.missingCorrect', { n: missing + 1 }));
		afterSave = '/dashboard';

		return;
	}
	if (hasAnswers.value && !confirmed) {
		warning.value = true;

		return;
	}
	warning.value = false;
	saving.value = true;
	try {
		if (quizId) {
			await api(`/quizzes/${quizId}`, 'PUT', quiz.value);
		} else {
			await api('/quizzes', 'POST', quiz.value);
		}
		savedState.value = JSON.stringify(quiz.value);
		toast.success(t('editor.saved'));
		router.push(afterSave);
	} catch (error) {
		afterSave = '/dashboard';
		toast.error((error as Error).message);
	} finally {
		saving.value = false;
	}
};

const cancelWarning = (): void => {
	warning.value = false;
	afterSave = '/dashboard';
};
</script>

<template>
	<form class="editor" @submit.prevent="save()">
		<aside class="panel">
			<QuizSettingsCard v-model="quiz" :is-new="!quizId" :max-questions="auth.user?.limits.maxQuestions ?? 0" :has-answers="hasAnswers" />
			<EditorActions
				:dirty="dirty"
				:saving="saving"
				:can-add="quiz.questions.length < (auth.user?.limits.maxQuestions ?? 0)"
				@add="addQuestion"
				@undo="undo"
			/>
		</aside>

		<div ref="questionsList">
			<TransitionGroup name="reorder" tag="div" class="questions">
				<QuestionEditor
					v-for="(question, index) in quiz.questions"
					:key="idOf(question)"
					v-model="quiz.questions[index]"
					:data-question="idOf(question)"
					:color-index="idOf(question)"
					:index="index"
					:total="quiz.questions.length"
					@remove="requestRemove(index)"
					@move="moveQuestion(index, $event)"
				/>
			</TransitionGroup>
		</div>

		<ConfirmModal :open="removing !== null" :title="t('editor.deleteQTitle')" :confirm-label="t('editor.deleteQConfirm')" @close="removing = null" @confirm="confirmRemove">
			<p>{{ t('editor.deleteQText', { n: (removing ?? 0) + 1, text: quiz.questions[removing ?? 0]?.text || '…' }) }}</p>
		</ConfirmModal>

		<LeaveModal :open="pendingLeave !== null" :text="t('editor.leaveText')" :saving="saving" @stay="pendingLeave = null" @discard="leave(false)" @save="leave(true)" />

		<ConfirmModal :open="warning" :title="t('editor.warnTitle')" :confirm-label="t('editor.saveAnyway')" :loading="saving" @close="cancelWarning" @confirm="save(true)">
			<p>{{ t('editor.warnText') }}</p>
			<p class="muted">{{ t('editor.warnHint') }}</p>
		</ConfirmModal>
	</form>
</template>

<style scoped>
.editor {
	display: grid;
	grid-template-columns: minmax(16rem, 21rem) minmax(0, 1fr);
	align-items: start;
	gap: 1.25rem;
}

.panel {
	position: sticky;
	top: calc(var(--header-height) + 1rem);
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.questions {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.reorder-move {
	transition: transform 0.4s ease;
}

.reorder-enter-active,
.reorder-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.reorder-enter-from,
.reorder-leave-to {
	opacity: 0;
	transform: scale(0.97);
}

.reorder-leave-active {
	position: absolute;
	width: 100%;
}

/* Narrow: settings on top, questions below, actions as a sticky bottom bar (EditorActions). */
@media (max-width: 900px) {
	.editor {
		grid-template-columns: minmax(0, 1fr);
	}

	.panel {
		display: contents;
	}
}
</style>
