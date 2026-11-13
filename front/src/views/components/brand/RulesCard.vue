<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { t } from '@/i18n';

const RULES = [
	'brand.rule1',
	'brand.rule2',
	'brand.rule3',
	'brand.rule4',
] as const;
</script>

<template>
	<BaseCard accent="var(--color-5)">
		<h2>{{ t('brand.style') }}</h2>
		<ul class="rules">
			<li v-for="rule in RULES" :key="rule"><AppIcon name="check" /> {{ t(rule) }}</li>
		</ul>
	</BaseCard>
</template>

<style scoped>
h2 {
	margin-bottom: 0.3rem;
}

.rules {
	display: grid;
	gap: 0.6rem;
	margin: 0.75rem 0 0;
	padding: 0;
	list-style: none;
}

.rules li {
	display: flex;
	gap: 0.5rem;
	align-items: baseline;
}
</style>
