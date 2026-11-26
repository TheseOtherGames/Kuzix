<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import PublicQuizGrid from '@/views/components/library/PublicQuizGrid.vue';
import type { PublicQuiz } from '@/interfaces/Quiz/QuizInterface';
import { api } from '@/utils/API';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';

const quizzes = ref<PublicQuiz[] | null>(null);
const search = ref('');

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

		<PublicQuizGrid v-if="quizzes" :quizzes="quizzes" />
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

.empty {
	text-align: center;
}
</style>
