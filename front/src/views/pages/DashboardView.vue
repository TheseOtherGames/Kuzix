<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import PillButton from '@/views/components/utils/form/PillButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import QuizCard from '@/views/components/dashboard/QuizCard.vue';
import ShareModal from '@/views/components/dashboard/ShareModal.vue';
import QuizPreviewList from '@/views/components/library/QuizPreviewList.vue';
import ImportModal from '@/views/components/dashboard/ImportModal.vue';
import type { Quiz, QuizDraft, QuizSummary } from '@/interfaces/Quiz/QuizInterface';
import { api } from '@/utils/API';
import { ANSWER_COLORS } from '@/utils/Answers';
import { downloadFile, slugify } from '@/utils/Download';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';
import { auth } from '@/utils/Auth';

const router = useRouter();
const quizzes = ref<QuizSummary[]>([]);
const loading = ref(true);
const sharing = ref<QuizSummary | null>(null);
const closing = ref<QuizSummary | null>(null);
const deleting = ref<QuizSummary | null>(null);
const recoding = ref<QuizSummary | null>(null);
const publishing = ref<QuizSummary | null>(null);
const pulling = ref<QuizSummary | null>(null);
const importing = ref(false);
const atQuizLimit = computed(() => quizzes.value.length >= (auth.user?.limits.maxQuizzes ?? 0));

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
	await api(`/quizzes/${quiz.uid}/open`, 'POST');
	router.push(`/host/${quiz.uid}`);
}, t('dash.opened'));

const closeQuiz = (): Promise<void> => run(async () => {
	await api(`/quizzes/${closing.value!.uid}/close`, 'POST');
	closing.value = null;
	await load();
}, t('dash.closed'));

const duplicateQuiz = (quiz: QuizSummary): Promise<void> => run(async () => {
	await api(`/quizzes/${quiz.uid}/duplicate`, 'POST');
	await load();
}, t('dash.duplicated'));

const regenerateCode = (): Promise<void> => run(async () => {
	const { code } = await api<{ code: string }>(`/quizzes/${recoding.value!.uid}/code`, 'POST');
	recoding.value = null;
	await load();
	toast.success(t('dash.newCodeDone', { code }));
});

const setPublic = (quiz: QuizSummary, isPublic: boolean): Promise<void> => run(async () => {
	await api(`/quizzes/${quiz.uid}/public`, 'PUT', { isPublic });
	publishing.value = null;
	await load();
}, t(isPublic ? 'dash.published' : 'dash.unpublished'));

const pullQuiz = (): Promise<void> => run(async () => {
	await api(`/quizzes/${pulling.value!.uid}/pull`, 'POST');
	pulling.value = null;
	await load();
}, t('dash.pulled'));

const deleteQuiz = (): Promise<void> => run(async () => {
	await api(`/quizzes/${deleting.value!.uid}`, 'DELETE');
	deleting.value = null;
	await load();
}, t('dash.deleted'));

const exportQuiz = (summary: QuizSummary): Promise<void> => run(async () => {
	const quiz = await api<Quiz>(`/quizzes/${summary.uid}`);
	const draft: QuizDraft = {
		title: quiz.title,
		revealMode: quiz.revealMode,
		countdown: quiz.countdown,
		questions: quiz.questions.map(({
			text, timeLimit, difficulty, answers,
		}) => ({
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
	const { uid } = await api<{ uid: string }>('/quizzes', 'POST', draft);
	toast.success(t('dash.imported'));
	router.push(`/quizzes/${uid}/edit`);
});
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
			<QuizCard
				v-for="(quiz, quizIndex) in quizzes"
				:key="quiz.uid"
				:quiz="quiz"
				:accent="ANSWER_COLORS[quizIndex % ANSWER_COLORS.length]"
				:can-duplicate="!atQuizLimit"
				@open="openQuiz(quiz)"
				@close="closing = quiz"
				@share="sharing = quiz"
				@duplicate="duplicateQuiz(quiz)"
				@export="exportQuiz(quiz)"
				@recode="recoding = quiz"
				@delete="deleting = quiz"
				@publish="publishing = quiz"
				@pull="pulling = quiz"
			/>
		</div>

		<ShareModal :code="sharing?.code ?? null" @close="sharing = null" />
		<ImportModal :open="importing" @close="importing = false" @file="importQuiz" />

		<ConfirmModal :open="Boolean(closing)" :title="t('dash.closeTitle')" :confirm-label="t('dash.closeConfirm')" @close="closing = null" @confirm="closeQuiz">
			<p>{{ t('dash.closeText', { title: closing?.title ?? '' }) }}</p>
		</ConfirmModal>

		<ConfirmModal :open="Boolean(recoding)" :title="t('dash.newCodeTitle')" :confirm-label="t('dash.newCodeConfirm')" icon="refresh" @close="recoding = null" @confirm="regenerateCode">
			<p>{{ t('dash.newCodeText', { code: recoding?.code ?? '' }) }}</p>
			<p class="muted">{{ t('dash.newCodeAuto') }}</p>
		</ConfirmModal>

		<ConfirmModal
			:open="Boolean(publishing)"
			:title="t(publishing?.isPublic ? 'dash.unpublishTitle' : 'dash.publishTitle')"
			:confirm-label="t(publishing?.isPublic ? 'dash.unpublish' : 'dash.publish')"
			icon="globe"
			@close="publishing = null"
			@confirm="setPublic(publishing!, !publishing!.isPublic)"
		>
			<template v-if="publishing?.isPublic">
				<p>{{ t('dash.unpublishText', { title: publishing.title }) }}</p>
				<p class="muted">{{ t('dash.unpublishHint') }}</p>
			</template>
			<template v-else>
				<p>{{ t('dash.publishText', { title: publishing?.title ?? '' }) }}</p>
				<p class="muted">{{ t('dash.publishHint') }}</p>
			</template>
		</ConfirmModal>

		<ConfirmModal :open="Boolean(pulling)" :title="t('dash.pullTitle')" :confirm-label="t('dash.pull')" icon="refresh" wide @close="pulling = null" @confirm="pullQuiz">
			<p>{{ t('dash.pullText', { title: pulling?.source?.title ?? '' }) }}</p>
			<p v-if="pulling?.runsCount" class="muted">{{ t('dash.pullStats') }}</p>
			<h3 class="preview-title">{{ t('dash.pullPreview') }}</h3>
			<QuizPreviewList v-if="pulling?.source" :url="`/quizzes/public/${pulling.source.uid}`" />
		</ConfirmModal>

		<ConfirmModal :open="Boolean(deleting)" :title="t('dash.deleteTitle')" :confirm-label="t('dash.deleteConfirm')" @close="deleting = null" @confirm="deleteQuiz">
			<p>{{ t('dash.deleteText', { title: deleting?.title ?? '' }) }}</p>
			<p v-if="deleting?.isOpen" class="muted">{{ t('dash.deleteRunning') }}</p>
		</ConfirmModal>
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

.num {
	min-width: 1.7rem;
	padding: 0.05rem 0.5rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--accent) 30%, var(--surface));
	color: var(--text);
	text-align: center;
}

.preview-title {
	margin: 1rem 0 0.5rem;
	font-size: 1rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
	gap: 1.25rem;
}

.empty {
	text-align: center;
}
</style>
