<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import InfoTip from '@/shared/ui/InfoTip.vue';
import QuestionEditor from '@/features/quiz/QuestionEditor.vue';
import type { Quiz, QuizDraft, QuestionDraft } from '@/features/quiz/quiz.types';
import { api } from '@/shared/api';
import { t, tp } from '@/shared/i18n/i18n';
import { toast } from '@/shared/toast.store';
import { auth } from '@/features/auth/auth.store';

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
</script>

<template>
	<form class="editor" @submit.prevent="save()">
		<aside class="panel">
			<BaseCard accent="var(--accent)" class="meta">
				<h1>{{ quizId ? t('editor.edit') : t('editor.new') }}</h1>
				<label>
					{{ t('editor.title') }}<InfoTip :text="t('editor.titleInfo')" />
					<input v-model="quiz.title" maxlength="100" required :placeholder="t('editor.titlePh')" />
				</label>
				<fieldset class="reveal">
					<legend>{{ t('editor.reveal') }}<InfoTip :text="t('editor.revealInfo')" /></legend>
					<label class="option">
						<input v-model="quiz.revealMode" type="radio" value="question" />
						{{ t('editor.revealQuestion') }}
					</label>
					<label class="option">
						<input v-model="quiz.revealMode" type="radio" value="end" />
						{{ t('editor.revealEnd') }}
					</label>
				</fieldset>
				<label>
					{{ t('editor.countdown') }}<InfoTip :text="t('editor.countdownInfo')" />
					<span class="with-unit">
						<input v-model.number="quiz.countdown" type="number" min="0" max="10" step="1" required inputmode="numeric" />
						<span class="unit" aria-hidden="true">s</span>
					</span>
				</label>
				<p class="muted count">{{ tp('editor.count', quiz.questions.length) }} / {{ auth.user?.limits.maxQuestions }}</p>
				<p v-if="hasAnswers" class="notice"><AppIcon name="warning" /> {{ t('editor.playedNotice') }}</p>
			</BaseCard>

			<div class="actions">
				<BaseButton variant="secondary" block :disabled="quiz.questions.length >= (auth.user?.limits.maxQuestions ?? 0)" @click="addQuestion"><AppIcon name="plus" /> {{ t('editor.add') }}</BaseButton>
				<div v-if="dirty" class="unsaved" role="status">
					<span class="unsaved-icon"><AppIcon name="pencil" /></span>
					<strong>{{ t('pf.unsaved') }}</strong>
					<BaseButton variant="ghost" size="sm" :disabled="saving" :title="t('pf.undo')" @click="undo"><AppIcon name="undo" /></BaseButton>
				</div>
				<div class="row">
					<BaseButton variant="ghost" to="/dashboard">{{ t('common.cancel') }}</BaseButton>
					<BaseButton type="submit" variant="success" :disabled="!dirty" :loading="saving">{{ t('editor.save') }}</BaseButton>
				</div>
			</div>
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

		<BaseModal :open="removing !== null" :title="t('editor.deleteQTitle')" @close="removing = null">
			<p>{{ t('editor.deleteQText', { n: (removing ?? 0) + 1, text: quiz.questions[removing ?? 0]?.text || '…' }) }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="removing = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="confirmRemove">{{ t('editor.deleteQConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="pendingLeave !== null" :title="t('pf.leaveTitle')" @close="pendingLeave = null">
			<p>{{ t('editor.leaveText') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="pendingLeave = null">{{ t('pf.leaveStay') }}</BaseButton>
				<BaseButton variant="danger" @click="leave(false)">{{ t('pf.leaveDiscard') }}</BaseButton>
				<BaseButton :loading="saving" @click="leave(true)"><AppIcon name="save" /> {{ t('pf.leaveSave') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="warning" :title="t('editor.warnTitle')" @close="warning = false; afterSave = '/dashboard'">
			<p>{{ t('editor.warnText') }}</p>
			<p class="muted">{{ t('editor.warnHint') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="warning = false; afterSave = '/dashboard'">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" :loading="saving" @click="save(true)">{{ t('editor.saveAnyway') }}</BaseButton>
			</template>
		</BaseModal>
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

.meta {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.meta h1 {
	margin: 0 0 0.25rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px dashed var(--border);
	font-size: clamp(1.5rem, 3vw, 2rem);
}

.reveal {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	border: none;
}

.reveal legend {
	margin-bottom: 0.5rem;
	font-weight: 500;
}

.option {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 400;
	cursor: pointer;
}

.with-unit {
	position: relative;
	display: block;
}

.with-unit input {
	padding-right: 2rem;
}

.unit {
	position: absolute;
	top: 50%;
	right: 0.9rem;
	color: var(--text-muted);
	transform: translateY(-50%);
	pointer-events: none;
}

.count {
	margin: 0;
}

.notice {
	margin: 0;
	padding: 0.6rem 0.8rem;
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--color-3) 20%, transparent);
	font-size: 0.9rem;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}

.unsaved {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.4rem 0.4rem 0.4rem 0.5rem;
	border: 2px solid var(--color-3);
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow), 0 0 0 4px color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: nudge 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.unsaved strong {
	flex: 1;
	font-size: 0.95rem;
}

.unsaved-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: wobble 1.6s ease-in-out infinite;
}

@keyframes nudge {
	from {
		transform: translateY(0.6rem);
	}
}

@keyframes wobble {
	50% {
		transform: rotate(-12deg);
	}
}

.row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.6rem;
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

/* Narrow: settings on top, questions below, actions as a sticky bottom bar. */
@media (max-width: 900px) {
	.editor {
		grid-template-columns: minmax(0, 1fr);
	}

	.panel {
		display: contents;
	}

	.actions {
		position: sticky;
		bottom: 0;
		z-index: 5;
		order: 1;
		padding: 1rem 0;
		background: linear-gradient(transparent, var(--bg) 30%);
	}
}
</style>
