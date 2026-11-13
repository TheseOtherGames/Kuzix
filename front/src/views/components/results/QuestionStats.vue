<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import QuestionStatItem from '@/views/components/results/QuestionStatItem.vue';
import type { QuestionStat } from '@/interfaces/Results/ResultsInterface';
import { t } from '@/i18n';

defineProps<{ stats: QuestionStat[] }>();
</script>

<template>
	<BaseCard accent="var(--color-4)">
		<h2><AppIcon name="chart" /> {{ t('results.questionsTitle') }}</h2>
		<ol class="questions">
			<QuestionStatItem v-for="stat in stats" :key="stat.index" :stat="stat" />
		</ol>
	</BaseCard>
</template>

<style scoped>
h2 {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0 0 0.5rem;
}

.questions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
</style>
