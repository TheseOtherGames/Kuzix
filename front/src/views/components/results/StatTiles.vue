<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import type { StatTile } from '@/interfaces/Results/ResultsInterface';
import { t } from '@/i18n';
import ProgressBar from '@/views/components/utils/progress/ProgressBar.vue';

defineProps<{ tiles: StatTile[] }>();
</script>

<template>
	<section class="tiles" :aria-label="t('results.overview')">
		<div v-for="tile in tiles" :key="tile.key" class="tile" :style="{ '--tile-color': tile.color }">
			<span class="tile-icon" aria-hidden="true"><AppIcon :name="tile.icon" /></span>
			<div class="tile-body">
				<span class="tile-label">{{ tile.label }} <InfoTip :text="tile.info" /></span>
				<span class="tile-value">{{ tile.value }} <small v-if="tile.unit">{{ tile.unit }}</small></span>
				<ProgressBar v-if="tile.ratio != null" class="meter" :ratio="tile.ratio" :color="tile.color" />
			</div>
		</div>
	</section>
</template>

<style scoped>
.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
	gap: 0.85rem;
}

.tile {
	display: flex;
	align-items: center;
	gap: 0.8rem;
	padding: 0.85rem 1rem;
	border: 2px solid color-mix(in srgb, var(--tile-color) 35%, var(--border));
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--tile-color) 55%, black);
}

.tile-icon {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tile-color) 22%, var(--surface));
	color: var(--tile-color);
	font-size: 1.4rem;
}

.tile-body {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.15rem;
	min-width: 0;
}

.tile-label {
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.tile-value {
	font-size: 1.6rem;
	font-weight: 700;
	line-height: 1.1;
	font-variant-numeric: tabular-nums;
}

.tile-value small {
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 500;
}

.meter {
	margin-top: 0.2rem;
}

@media (max-width: 560px) {
	.tiles {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.tile {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.7rem;
	}

	.tile-body {
		width: 100%;
	}

	.tile-icon {
		width: 2.2rem;
		height: 2.2rem;
		font-size: 1.1rem;
	}

	.tile-value {
		font-size: 1.3rem;
	}
}
</style>
