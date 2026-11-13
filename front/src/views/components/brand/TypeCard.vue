<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { t } from '@/i18n';
</script>

<template>
	<BaseCard accent="var(--color-3)">
		<h2>{{ t('brand.type') }}</h2>
		<div class="font">
			<p class="sample fredoka">Aa Bb 123</p>
			<p><strong>Fredoka</strong> · {{ t('brand.fredoka') }}</p>
		</div>
		<div class="font">
			<p class="sample mono">AB12CD</p>
			<p><strong>JetBrains Mono</strong> · {{ t('brand.mono') }}</p>
		</div>
	</BaseCard>
</template>

<style scoped>
h2 {
	margin-bottom: 0.3rem;
}

.font {
	padding: 0.75rem 0;
	border-bottom: 1px dashed var(--border);
}

.font:last-child {
	border-bottom: none;
}

.sample {
	margin: 0;
	font-size: 2.5rem;
	font-weight: 700;
}

.sample.mono {
	font-family: var(--font-mono);
	letter-spacing: 0.15em;
}
</style>
