<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../../shared/ui/AppIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import PillButton from '../../shared/ui/PillButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import InfoTip from '../../shared/ui/InfoTip.vue';
import type { Quiz, QuizDraft, QuizSummary } from './quiz.types';
import { api } from '../../shared/api';
import { ANSWER_COLORS } from '../../shared/answers';
import { downloadFile, slugify } from '../../shared/download';
import type { MessageKey } from '../../shared/i18n/en';
import { LOCALES, locale, t, tp } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';
import { auth } from '../auth/auth.store';

const router = useRouter();
const quizzes = ref<QuizSummary[]>([]);
const loading = ref(true);
const sharing = ref<QuizSummary | null>(null);
const closing = ref<QuizSummary | null>(null);
const deleting = ref<QuizSummary | null>(null);
const recoding = ref<QuizSummary | null>(null);
const importInput = ref<HTMLInputElement | null>(null);
const atQuizLimit = computed(() => quizzes.value.length >= (auth.user?.limits.maxQuizzes ?? 0));
const importing = ref(false);
const dragging = ref(false);

// The JSON example is kept out of i18n: its braces would be read as {params}.
const EXAMPLE: QuizDraft = {
	title: 'Quiz title',
	revealMode: 'question',
	countdown: 3,
	questions: [{
		text: 'Question text?',
		timeLimit: 20,
		difficulty: 2,
		answers: [{ text: 'Right answer', isCorrect: true }, { text: 'Wrong answer', isCorrect: false }],
	}],
};

// Prompt builder: the form fills the {params}, the rules stay in sync with the server's parseQuizInput.
const ai = reactive({ topic: '', count: 10, answers: 4, correctMin: 1, correctMax: 1, time: 20, difficulty: 0, language: locale.value, notes: '' });
const clamp = (value: number, min: number, max: number, fallback: number): number =>
	Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
const aiPrompt = computed(() => {
	const answers = clamp(ai.answers, 2, 6, 4);
	const correctMin = clamp(ai.correctMin, 1, answers, 1);
	const correctMax = clamp(ai.correctMax, correctMin, answers, correctMin);
	const prompt = t('dash.aiPrompt', {
		topic: ai.topic.trim() || '[?]',
		count: clamp(ai.count, 1, auth.user?.limits.maxQuestions ?? 10, 10),
		answers,
		correct: correctMin === correctMax
			? tp('dash.ai.correctExact', correctMin)
			: t('dash.ai.correctRange', { min: correctMin, max: correctMax }),
		time: clamp(ai.time, 5, 120, 20),
		difficulty: ai.difficulty ? `${ai.difficulty} (${t(`q.level.${ai.difficulty}` as MessageKey)})` : t('dash.ai.mixed'),
		language: t(`dash.ai.lang.${ai.language}` as MessageKey),
	});
	const notes = ai.notes.trim() ? `\n${t('dash.ai.notesLine', { notes: ai.notes.trim() })}` : '';
	return `${prompt}${notes}\n\n${JSON.stringify(EXAMPLE, null, 2)}`;
});

const shareLink = computed(() => (sharing.value ? `${location.origin}/play/${sharing.value.code}` : ''));

const load = async (): Promise<void> => {
	try {
		quizzes.value = await api<QuizSummary[]>('/quizzes');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		loading.value = false;
	}
};

onMounted(load);

const run = async (action: () => Promise<void>, success?: string): Promise<void> => {
	try {
		await action();
		if (success) {
			toast.success(success);
		}
	} catch (error) {
		toast.error((error as Error).message);
	}
};

const openQuiz = (quiz: QuizSummary): Promise<void> => run(async () => {
	await api(`/quizzes/${quiz.id}/open`, 'POST');
	router.push(`/host/${quiz.id}`);
}, t('dash.opened'));

const closeQuiz = (): Promise<void> => run(async () => {
	await api(`/quizzes/${closing.value!.id}/close`, 'POST');
	closing.value = null;
	await load();
}, t('dash.closed'));

const duplicateQuiz = (quiz: QuizSummary): Promise<void> => run(async () => {
	await api(`/quizzes/${quiz.id}/duplicate`, 'POST');
	await load();
}, t('dash.duplicated'));

const regenerateCode = (): Promise<void> => run(async () => {
	const { code } = await api<{ code: string }>(`/quizzes/${recoding.value!.id}/code`, 'POST');
	recoding.value = null;
	await load();
	toast.success(t('dash.newCodeDone', { code }));
});

const deleteQuiz = (): Promise<void> => run(async () => {
	await api(`/quizzes/${deleting.value!.id}`, 'DELETE');
	deleting.value = null;
	await load();
}, t('dash.deleted'));

const exportQuiz = (summary: QuizSummary): Promise<void> => run(async () => {
	const quiz = await api<Quiz>(`/quizzes/${summary.id}`);
	const draft: QuizDraft = {
		title: quiz.title,
		revealMode: quiz.revealMode,
		countdown: quiz.countdown,
		questions: quiz.questions.map(({ text, timeLimit, difficulty, answers }) => ({
			text,
			timeLimit,
			difficulty,
			answers: answers.map((answer) => ({ text: answer.text, isCorrect: answer.isCorrect })),
		})),
	};
	downloadFile(`${slugify(quiz.title)}.json`, JSON.stringify(draft, null, '\t'), 'application/json');
});

// The server validates the content, so a bad file only shows its error message.
const importQuiz = (file: File | undefined): Promise<void> => run(async () => {
	if (!file) {
		return;
	}
	let draft: unknown;
	try {
		draft = JSON.parse(await file.text());
	} catch {
		throw new Error(t('dash.badFile'));
	}
	const { id } = await api<{ id: number }>('/quizzes', 'POST', draft);
	toast.success(t('dash.imported'));
	router.push(`/quizzes/${id}/edit`);
});

const pickFile = (event: Event): Promise<void> => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	return importQuiz(file);
};

const dropFile = (event: DragEvent): Promise<void> => {
	dragging.value = false;
	return importQuiz(event.dataTransfer?.files[0]);
};

const copyLink = (): Promise<void> => run(() => navigator.clipboard.writeText(shareLink.value), t('dash.linkCopied'));
const copyPrompt = (): Promise<void> => run(() => navigator.clipboard.writeText(aiPrompt.value), t('dash.promptCopied'));
</script>

<template>
	<div class="dashboard">
		<header class="top">
			<h1>{{ t('dash.title') }} <span class="muted num">{{ quizzes.length }} / {{ auth.user?.limits.maxQuizzes }}</span></h1>
			<div class="top-actions">
				<PillButton variant="secondary" :label="t('dash.import')" @click="importing = true"><AppIcon name="upload" /></PillButton>
				<PillButton v-if="!atQuizLimit" to="/quizzes/new" variant="success" :label="t('dash.newQuiz')"><AppIcon name="plus" /></PillButton>
			</div>
		</header>

		<p v-if="loading" class="muted">{{ t('common.loading') }}</p>
		<BaseCard v-else-if="!quizzes.length" class="empty">
			<p>{{ t('dash.empty') }}</p>
			<BaseButton to="/quizzes/new">{{ t('dash.create') }}</BaseButton>
		</BaseCard>

		<div class="grid">
			<BaseCard v-for="(quiz, i) in quizzes" :key="quiz.id" :accent="ANSWER_COLORS[i % ANSWER_COLORS.length]" class="quiz">
				<div class="title-row">
					<h2>{{ quiz.title }}</h2>
					<span class="status" :class="{ open: quiz.isOpen }">{{ quiz.isOpen ? t('dash.statusOpen') : t('dash.statusClosed') }}</span>
				</div>
				<ul class="facts">
					<li><strong class="num">{{ quiz.questionsCount }}</strong><span>{{ tp('dash.questions', quiz.questionsCount) }}</span></li>
					<li><strong class="num">{{ quiz.runsCount }}</strong><span>{{ tp('dash.plays', quiz.runsCount) }}</span></li>
					<li><span>{{ t('dash.code') }}</span><strong class="num code selectable">{{ quiz.code }}</strong></li>
				</ul>

				<section class="section">
					<h3 class="section-title">{{ t('dash.sectionPlay') }}</h3>
					<div class="play">
						<template v-if="quiz.isOpen">
							<BaseButton variant="success" :to="`/host/${quiz.id}`"><AppIcon name="play" /> {{ t('dash.host') }}</BaseButton>
							<BaseButton variant="danger" @click="closing = quiz"><AppIcon name="stop" /> {{ t('dash.close') }}</BaseButton>
						</template>
						<BaseButton v-else variant="success" @click="openQuiz(quiz)"><AppIcon name="play" /> {{ quiz.runsCount ? t('dash.reopen') : t('dash.open') }}</BaseButton>
						<BaseButton variant="secondary" @click="sharing = quiz"><AppIcon name="link" /> {{ t('dash.share') }}</BaseButton>
						<BaseButton v-if="quiz.runsCount" variant="primary" :to="`/quizzes/${quiz.id}/results`"><AppIcon name="chart" /> {{ t('dash.results') }}</BaseButton>
					</div>
				</section>

				<section class="section">
					<h3 class="section-title">{{ t('dash.sectionManage') }}</h3>
					<div class="manage">
						<RouterLink
							v-if="!quiz.isOpen"
							class="tool"
							:to="`/quizzes/${quiz.id}/edit`"
						><AppIcon name="pencil" />{{ t('dash.edit') }}</RouterLink>
						<button v-if="!atQuizLimit" type="button" class="tool" @click="duplicateQuiz(quiz)"><AppIcon name="page" />{{ t('dash.duplicate') }}</button>
						<button type="button" class="tool" @click="exportQuiz(quiz)"><AppIcon name="download" />{{ t('dash.export') }}</button>
						<button type="button" class="tool" @click="recoding = quiz"><AppIcon name="refresh" />{{ t('dash.newCode') }}</button>
						<button type="button" class="tool danger" @click="deleting = quiz"><AppIcon name="trash" />{{ t('dash.delete') }}</button>
					</div>
				</section>
			</BaseCard>
		</div>

		<BaseModal :open="Boolean(sharing)" :title="t('dash.shareTitle')" @close="sharing = null">
			<p class="muted">{{ t('dash.shareCode') }}</p>
			<p class="big-code selectable">{{ sharing?.code }}</p>
			<input :value="shareLink" readonly :aria-label="t('dash.shareLink')" @focus="($event.target as HTMLInputElement).select()" />
			<template #actions>
				<BaseButton variant="ghost" @click="sharing = null">{{ t('common.close') }}</BaseButton>
				<BaseButton @click="copyLink">{{ t('dash.copyLink') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="importing" :title="t('dash.importTitle')" wide @close="importing = false">
			<section class="import-block">
				<header class="block-head">
					<span class="block-icon"><AppIcon name="page" /></span>
					<div>
						<h3 class="block-title">{{ t('dash.fileTitle') }}</h3>
						<p class="muted">{{ t('dash.importText') }}</p>
					</div>
				</header>
				<button
					type="button"
					class="file-zone"
					:class="{ dragging }"
					@click="importInput?.click()"
					@dragover.prevent="dragging = true"
					@dragleave="dragging = false"
					@drop.prevent="dropFile"
				>
					<strong><AppIcon name="upload" /> {{ t('dash.importFile') }}</strong>
					<span class="muted">{{ t('dash.dropHint') }}</span>
				</button>
				<input ref="importInput" type="file" accept=".json,application/json" hidden @change="pickFile" />
			</section>

			<section class="import-block">
				<header class="block-head">
					<span class="block-icon"><AppIcon name="sparkles" /></span>
					<div>
						<h3 class="block-title">{{ t('dash.aiTitle') }}</h3>
						<p class="muted">{{ t('dash.aiText') }}</p>
					</div>
				</header>
				<ol class="steps">
					<li>{{ t('dash.ai.step1') }}</li>
					<li>{{ t('dash.ai.step2') }}</li>
					<li>{{ t('dash.ai.step3') }}</li>
				</ol>
				<form id="ai-form" @submit.prevent="copyPrompt">
					<fieldset class="ai-group">
						<legend>{{ t('dash.ai.groupContent') }}</legend>
						<div class="ai-form">
							<label class="wide">
								<span>{{ t('dash.ai.topic') }}<InfoTip :text="t('dash.ai.topicInfo')" /></span>
								<input v-model="ai.topic" required maxlength="200" :placeholder="t('dash.ai.topicPh')" />
							</label>
							<label>
								<span>{{ t('dash.ai.language') }}<InfoTip :text="t('dash.ai.languageInfo')" /></span>
								<select v-model="ai.language">
									<option v-for="option in LOCALES" :key="option.value" :value="option.value">{{ option.label }}</option>
								</select>
							</label>
							<label>
								<span>{{ t('dash.ai.difficulty') }}<InfoTip :text="t('dash.ai.difficultyInfo')" /></span>
								<select v-model.number="ai.difficulty">
									<option :value="0">{{ t('dash.ai.mixedOption') }}</option>
									<option v-for="n in 5" :key="n" :value="n">{{ n }} · {{ t(`q.level.${n}` as MessageKey) }}</option>
								</select>
							</label>
							<label class="wide">
								<span>{{ t('dash.ai.notes') }}<InfoTip :text="t('dash.ai.notesInfo')" /></span>
								<textarea v-model="ai.notes" rows="2" maxlength="500" :placeholder="t('dash.ai.notesPh')" />
							</label>
						</div>
					</fieldset>
					<fieldset class="ai-group">
						<legend>{{ t('dash.ai.groupFormat') }}</legend>
						<div class="ai-form">
							<label>
								<span>{{ t('dash.ai.count') }}<InfoTip :text="t('dash.ai.countInfo')" /></span>
								<input v-model.number="ai.count" type="number" min="1" :max="auth.user?.limits.maxQuestions" step="1" inputmode="numeric" />
							</label>
							<label>
								<span>{{ t('dash.ai.time') }}<InfoTip :text="t('dash.ai.timeInfo')" /></span>
								<span class="with-unit">
									<input v-model.number="ai.time" type="number" min="5" max="120" step="1" inputmode="numeric" />
									<span class="unit" aria-hidden="true">s</span>
								</span>
							</label>
							<label>
								<span>{{ t('dash.ai.answers') }}<InfoTip :text="t('dash.ai.answersInfo')" /></span>
								<input v-model.number="ai.answers" type="number" min="2" max="6" step="1" inputmode="numeric" />
							</label>
							<div class="range">
								<span>{{ t('dash.ai.correct') }}<InfoTip :text="t('dash.ai.correctInfo')" /></span>
								<span class="range-inputs">
									<input v-model.number="ai.correctMin" type="number" min="1" :max="ai.answers" step="1" inputmode="numeric" :aria-label="t('dash.ai.correctMin')" :placeholder="t('dash.ai.correctMin')" />
									<span aria-hidden="true">–</span>
									<input v-model.number="ai.correctMax" type="number" :min="ai.correctMin" :max="ai.answers" step="1" inputmode="numeric" :aria-label="t('dash.ai.correctMax')" :placeholder="t('dash.ai.correctMax')" />
								</span>
							</div>
						</div>
					</fieldset>
				</form>
				<details class="preview">
					<summary>{{ t('dash.ai.preview') }}</summary>
					<textarea class="ai-prompt selectable" :value="aiPrompt" readonly rows="10" :aria-label="t('dash.ai.preview')" />
				</details>
			</section>
			<template #actions>
				<BaseButton variant="ghost" @click="importing = false">{{ t('common.close') }}</BaseButton>
				<BaseButton type="submit" form="ai-form" :disabled="!ai.topic.trim()"><AppIcon name="clipboard" /> {{ t('dash.copyPrompt') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="Boolean(closing)" :title="t('dash.closeTitle')" @close="closing = null">
			<p>{{ t('dash.closeText', { title: closing?.title ?? '' }) }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="closing = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="closeQuiz">{{ t('dash.closeConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="Boolean(recoding)" :title="t('dash.newCodeTitle')" @close="recoding = null">
			<p>{{ t('dash.newCodeText', { code: recoding?.code ?? '' }) }}</p>
			<p class="muted">{{ t('dash.newCodeAuto') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="recoding = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="regenerateCode"><AppIcon name="refresh" /> {{ t('dash.newCodeConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="Boolean(deleting)" :title="t('dash.deleteTitle')" @close="deleting = null">
			<p>{{ t('dash.deleteText', { title: deleting?.title ?? '' }) }}</p>
			<p v-if="deleting?.isOpen" class="muted">{{ t('dash.deleteRunning') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="deleting = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="deleteQuiz">{{ t('dash.deleteConfirm') }}</BaseButton>
			</template>
		</BaseModal>
	</div>
</template>

<style scoped>
.top {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.5rem;
}

.top-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.top h1 {
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
	gap: 1.25rem;
}

.quiz {
	display: flex;
	flex-direction: column;
}

.title-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}

.title-row h2 {
	overflow-wrap: anywhere;
}

.status {
	padding: 0.15rem 0.7rem;
	border-radius: 999px;
	background: var(--surface-2);
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 600;
}

.status.open {
	background: var(--btn-success);
	color: var(--on-color);
}

.facts {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: 0 0 1rem;
	padding: 0;
	list-style: none;
	color: var(--text-muted);
	font-size: 0.9rem;
}

.facts li {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.2rem 0.7rem 0.2rem 0.2rem;
	border-radius: 999px;
	background: var(--surface-2);
}

.facts li:last-child {
	padding: 0.2rem 0.2rem 0.2rem 0.7rem;
}

.num {
	min-width: 1.7rem;
	padding: 0.05rem 0.5rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--accent) 30%, var(--surface));
	color: var(--text);
	text-align: center;
}

.code {
	font-family: var(--font-mono);
	letter-spacing: 0.05em;
}

.section {
	padding-top: 0.75rem;
	border-top: 1px dashed var(--border);
}

.section + .section {
	margin-top: 0.75rem;
}

.section:first-of-type {
	margin-top: auto;
}

.section-title {
	margin: 0 0 0.5rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.play,
.manage {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* Whole buttons wrap to the next row; their label never does. */
.play > *,
.manage > * {
	flex: 1 1 auto;
}

.tool {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.3rem;
	padding: 0.45rem 0.55rem;
	white-space: nowrap;
	border: 2px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface-2);
	color: var(--text);
	font-size: 0.8rem;
	font-weight: 500;
	text-decoration: none;
	cursor: pointer;
	transition: transform 0.15s, border-color 0.15s;
}

.tool .app-icon {
	font-size: 1.15rem;
	margin-block: -0.2rem;
}

.tool:hover {
	transform: translateY(-0.15rem);
	border-color: var(--accent-line);
}

.tool.danger:hover {
	border-color: var(--danger);
	color: var(--danger);
}

.big-code {
	width: fit-content;
	margin: 0.5rem auto 1rem;
	padding: 0.3rem 1.2rem;
	border-radius: var(--radius);
	background: var(--color-3);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--color-3) 55%, black);
	color: #1e2230;
	font-family: var(--font-mono);
	font-size: clamp(2rem, 9vw, 3rem);
	font-weight: 700;
	letter-spacing: 0.12em;
	text-align: center;
}

.import-block {
	padding: 1rem;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface-2);
}

.import-block + .import-block {
	margin-top: 1rem;
}

.block-head {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
}

.block-head p {
	margin: 0.15rem 0 0;
}

.block-title {
	margin: 0;
	font-size: 1.1rem;
}

.block-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-5) 25%, var(--surface));
	font-size: 1.1rem;
}

.file-zone {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.2rem;
	width: 100%;
	padding: 1rem;
	border: 2px dashed var(--accent-line);
	border-radius: var(--radius-sm);
	background: var(--surface);
	color: var(--text);
	font: inherit;
	cursor: pointer;
	transition: transform 0.15s, background 0.15s;
}

/* Children ignore the pointer so dragleave doesn't fire when crossing them. */
.file-zone > * {
	pointer-events: none;
}

.file-zone.dragging {
	border-style: solid;
}

.file-zone:hover,
.file-zone.dragging {
	transform: translateY(-0.15rem);
	background: color-mix(in srgb, var(--color-5) 10%, var(--surface));
}

.steps {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: 0 0 0.75rem;
	padding: 0;
	list-style: none;
	counter-reset: step;
}

.steps li {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.2rem 0.7rem 0.2rem 0.2rem;
	border-radius: 999px;
	background: var(--surface);
	font-size: 0.85rem;
	counter-increment: step;
}

.steps li::before {
	content: counter(step);
	display: grid;
	place-items: center;
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-color);
	font-weight: 700;
	font-size: 0.75rem;
}

.ai-group {
	margin: 0;
	padding: 0.75rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
}

.ai-group + .ai-group {
	margin-top: 0.75rem;
}

.ai-group legend {
	padding: 0 0.4rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.range {
	font-weight: 500;
}

.range-inputs {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.range-inputs input {
	min-width: 0;
}

.ai-form {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	align-items: end;
	gap: 0.75rem;
}

.ai-form .wide {
	grid-column: 1 / -1;
}

.ai-form input,
.ai-form select,
.ai-form textarea {
	width: 100%;
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

.preview {
	margin-top: 0.75rem;
}

.preview summary {
	width: fit-content;
	padding: 0.25rem 0.75rem;
	border-radius: 999px;
	color: var(--accent-text);
	font-weight: 600;
	cursor: pointer;
}

.preview summary:hover {
	background: color-mix(in srgb, var(--color-5) 15%, transparent);
}

.preview .ai-prompt {
	margin-top: 0.5rem;
}

.ai-prompt {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.8rem;
	resize: vertical;
}

.empty {
	text-align: center;
}
</style>
