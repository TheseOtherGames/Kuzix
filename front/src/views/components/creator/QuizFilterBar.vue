<script setup lang="ts">
import type { MessageKey } from '@/locales/en';
import { t } from '@/i18n';

export type QuizSort = 'recent' | 'downloads' | 'questions' | 'title';

const SORTS: QuizSort[] = [
	'recent',
	'downloads',
	'questions',
	'title',
];

const search = defineModel<string>('search', { required: true });
const sort = defineModel<QuizSort>('sort', { required: true });
</script>

<template>
	<div class="filters">
		<input v-model="search" type="search" class="search" :placeholder="t('creator.search')" :aria-label="t('creator.search')" />
		<label class="sort">
			<span>{{ t('creator.sortBy') }}</span>
			<select v-model="sort">
				<option v-for="option in SORTS" :key="option" :value="option">{{ t(`creator.sort.${option}` as MessageKey) }}</option>
			</select>
		</label>
	</div>
</template>

<style scoped>
.filters {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}

.search {
	flex: 1 1 14rem;
	max-width: 22rem;
}

.sort {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	white-space: nowrap;
}
</style>
