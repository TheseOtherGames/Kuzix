<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { ANSWER_COLORS, ANSWER_ICONS } from '@/utils/Answers';
import { t } from '@/i18n';
</script>

<template>
	<BaseCard accent="var(--color-4)">
		<h2>{{ t('brand.shapes') }}</h2>
		<p class="muted">{{ t('brand.shapesText') }}</p>
		<div class="shapes">
			<span v-for="(icon, shapeIndex) in ANSWER_ICONS" :key="icon" class="shape" :style="{ background: ANSWER_COLORS[shapeIndex] }">
				<AppIcon :name="icon" />
			</span>
		</div>
	</BaseCard>
</template>

<style scoped>
h2 {
	margin-bottom: 0.3rem;
}

.muted {
	color: var(--text-muted);
}

.shapes {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
	margin-top: 1rem;
}

.shape {
	display: grid;
	place-items: center;
	width: 3.5rem;
	height: 3.5rem;
	border-radius: var(--radius-sm);
	font-size: 1.8rem;
	box-shadow: 0 0.3rem 0 rgba(0, 0, 0, 0.3);
}
</style>
