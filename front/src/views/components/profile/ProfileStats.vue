<script setup lang="ts">
import { ANSWER_COLORS } from '@/utils/Answers';

defineProps<{ tiles: { label: string; value: string | number }[] }>();
</script>

<template>
	<div class="stats">
		<div v-for="(tile, tileIndex) in tiles" :key="tile.label" class="stat" :style="{ '--stat-color': ANSWER_COLORS[tileIndex] }">
			<span class="value">{{ tile.value }}</span>
			<span class="label">{{ tile.label }}</span>
		</div>
	</div>
</template>

<style scoped>
.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	gap: 1rem;
}

.stat {
	display: flex;
	flex-direction: column;
	padding: 1rem 1.25rem;
	border-radius: var(--radius);
	background: var(--stat-color);
	color: var(--on-color);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--stat-color) 55%, black);
}

.value {
	font-size: 2rem;
	font-weight: 700;
	line-height: 1.1;
}
</style>
