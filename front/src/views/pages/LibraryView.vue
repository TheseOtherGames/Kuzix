<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import QuizPreviewList from '@/views/components/library/QuizPreviewList.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import PublicQuizCard from '@/views/components/library/PublicQuizCard.vue';
import type { PublicQuiz } from '@/interfaces/Quiz/QuizInterface';
import { api } from '@/utils/API';
import { ANSWER_COLORS } from '@/utils/Answers';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';
import { auth } from '@/utils/Auth';

const router = useRouter();
const quizzes = ref<PublicQuiz[] | null>(null);
const search = ref('');
const copying = ref<string | null>(null);
const previewing = ref<PublicQuiz | null>(null);
const reporting = ref<PublicQuiz | null>(null);
const reportReason = ref('');
const sendingReport = ref(false);

const startReport = (quiz: PublicQuiz): void => {
	reporting.value = quiz;
	reportReason.value = '';
};

const sendReport = async (): Promise<void> => {
	sendingReport.value = true;
	try {
		await api(`/quizzes/public/${reporting.value!.uid}/report`, 'POST', { reason: reportReason.value });
		toast.success(t('library.reported'));
		reporting.value!.reported = true;
		reporting.value = null;
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		sendingReport.value = false;
	}
};

const load = async (): Promise<void> => {
	try {
		quizzes.value = await api<PublicQuiz[]>(`/quizzes/public?q=${encodeURIComponent(search.value.trim())}`);
	} catch (error) {
		toast.error((error as Error).message);
	}
};

let timer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
	clearTimeout(timer);
	timer = setTimeout(load, 250);
});
onMounted(load);

const copyQuiz = async (quiz: PublicQuiz): Promise<void> => {
	copying.value = quiz.uid;
	try {
		await api(`/quizzes/public/${quiz.uid}/copy`, 'POST');
		toast.success(t('library.copied', { title: quiz.title }));
		router.push('/dashboard');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		copying.value = null;
	}
};
</script>

<template>
	<div class="library">
		<header class="top">
			<div>
				<h1>{{ t('library.title') }}</h1>
				<p class="muted">{{ t('library.intro') }}</p>
			</div>
			<input v-model="search" type="search" class="search" :placeholder="t('library.search')" :aria-label="t('library.search')" />
		</header>

		<p v-if="!quizzes" class="muted">{{ t('common.loading') }}</p>
		<BaseCard v-else-if="!quizzes.length" class="empty">
			<p>{{ search ? t('library.noMatch') : t('library.empty') }}</p>
		</BaseCard>

		<div class="grid">
			<PublicQuizCard
				v-for="(quiz, quizIndex) in quizzes"
				:key="quiz.uid"
				:quiz="quiz"
				:accent="ANSWER_COLORS[quizIndex % ANSWER_COLORS.length]"
				:index="quizIndex"
				:copying="copying === quiz.uid"
				@copy="copyQuiz(quiz)"
				@preview="previewing = quiz"
				@report="startReport(quiz)"
			/>
		</div>

		<BaseModal :open="Boolean(previewing)" :title="previewing?.title ?? ''" wide @close="previewing = null">
			<QuizPreviewList v-if="previewing" :url="`/quizzes/public/${previewing.uid}`" />
			<template #actions>
				<BaseButton variant="ghost" @click="previewing = null">{{ t('common.close') }}</BaseButton>
				<BaseButton v-if="auth.user" variant="success" :loading="copying === previewing?.uid" @click="copyQuiz(previewing!)"><AppIcon name="plus" /> {{ t('library.copy') }}</BaseButton>
				<BaseButton v-else variant="secondary" :to="`/login?redirect=${encodeURIComponent('/library')}`">{{ t('library.logInToCopy') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="Boolean(reporting)" :title="t('library.reportTitle', { title: reporting?.title ?? '' })" @close="reporting = null">
			<p>{{ t('library.reportText') }}</p>
			<label class="report-reason">
				<span>{{ t('library.reportReason') }}</span>
				<textarea v-model="reportReason" rows="4" maxlength="500" required></textarea>
			</label>
			<template #actions>
				<BaseButton variant="ghost" @click="reporting = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" :loading="sendingReport" :disabled="!reportReason.trim()" @click="sendReport"><AppIcon name="flag" /> {{ t('library.reportSend') }}</BaseButton>
			</template>
		</BaseModal>
	</div>
</template>

<style scoped>
.top {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.5rem;
}

.top h1 {
	margin: 0;
}

.top p {
	margin: 0.25rem 0 0;
}

.search {
	width: min(100%, 20rem);
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
	gap: 1.25rem;
}

.report-reason {
	display: grid;
	gap: 0.35rem;
	font-weight: 600;
}

.empty {
	text-align: center;
}
</style>
