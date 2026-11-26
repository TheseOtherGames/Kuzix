<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NotFoundView from '@/views/pages/NotFoundView.vue';
import PillButton from '@/views/components/utils/form/PillButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import CreatorHeader from '@/views/components/creator/CreatorHeader.vue';
import QuizFilterBar from '@/views/components/creator/QuizFilterBar.vue';
import type { QuizSort } from '@/views/components/creator/QuizFilterBar.vue';
import ProfileStats from '@/views/components/profile/ProfileStats.vue';
import PublicQuizGrid from '@/views/components/library/PublicQuizGrid.vue';
import type { PublicProfile, PublicQuiz } from '@/interfaces/Quiz/QuizInterface';
import { api, ApiError } from '@/utils/API';
import { locale, t, tp } from '@/i18n';
import { toast } from '@/utils/Toast';

const route = useRoute();
const router = useRouter();
const profile = ref<PublicProfile | null>(null);
const missing = ref(false);
const search = ref('');
const sort = ref<QuizSort>('recent');

// history.state.back is set by vue-router: empty when the card was opened from a link outside the app.
const goBack = (): void => {
	if (window.history.state?.back) {
		router.back();
	} else {
		router.push('/library');
	}
};

const load = async (): Promise<void> => {
	profile.value = null;
	missing.value = false;
	try {
		profile.value = await api<PublicProfile>(`/users/public/${encodeURIComponent(String(route.params.uid))}`);
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) {
			missing.value = true;
		} else {
			toast.error((error as Error).message);
		}
	}
};

watch(() => route.params.uid, load, { immediate: true });

const sum = (pick: (quiz: PublicQuiz) => number): number => profile.value?.quizzes.reduce((total, quiz) => total + pick(quiz), 0) ?? 0;

const statTiles = computed(() => {
	const count = profile.value?.quizzes.length ?? 0;
	const questions = sum((quiz) => quiz.questionsCount);
	const downloads = sum((quiz) => quiz.downloads);

	return [
		{ label: tp('creator.stat.quizzes', count), value: count },
		{ label: tp('creator.stat.questions', questions), value: questions },
		{ label: tp('library.downloads', downloads), value: downloads },
		{ label: t('creator.stat.average'), value: count ? (downloads / count).toLocaleString(locale.value, { maximumFractionDigits: 1 }) : 0 },
	];
});

const SORTERS: Record<QuizSort, (first: PublicQuiz, second: PublicQuiz) => number> = {
	recent: (first, second) => second.updatedAt.localeCompare(first.updatedAt),
	downloads: (first, second) => second.downloads - first.downloads,
	questions: (first, second) => second.questionsCount - first.questionsCount,
	title: (first, second) => first.title.localeCompare(second.title, locale.value),
};

const shown = computed(() => {
	const query = search.value.trim().toLocaleLowerCase();

	return (profile.value?.quizzes ?? [])
		.filter((quiz) => quiz.title.toLocaleLowerCase().includes(query))
		.sort(SORTERS[sort.value]);
});
</script>

<template>
	<div class="creator-page">
		<PillButton v-if="!missing" :label="t('common.back')" class="back is-back" @click="goBack">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
		</PillButton>

		<p v-if="!profile && !missing" class="muted">{{ t('common.loading') }}</p>

		<!-- Same page as a wrong URL: a user without a public quiz has no card, and this doesn't reveal that the account exists. -->
		<NotFoundView v-else-if="missing" />

		<template v-else-if="profile">
			<CreatorHeader :profile="profile" />
			<ProfileStats :tiles="statTiles" />

			<section class="quizzes" :aria-label="t('creator.quizzes')">
				<h2>{{ t('creator.quizzes') }}</h2>
				<QuizFilterBar v-model:search="search" v-model:sort="sort" />
				<BaseCard v-if="!shown.length" class="empty">
					<p>{{ t('library.noMatch') }}</p>
				</BaseCard>
				<PublicQuizGrid :quizzes="shown" hide-owner />
			</section>
		</template>
	</div>
</template>

<style scoped>
.creator-page {
	display: grid;
	gap: 1.75rem;
}

.back {
	justify-self: start;
}

.back svg {
	width: 1.15rem;
	height: 1.15rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.6;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.quizzes {
	display: grid;
	gap: 1rem;
}

.quizzes h2 {
	margin: 0;
}

.empty {
	text-align: center;
}
</style>
