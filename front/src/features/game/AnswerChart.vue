<script setup lang="ts">
import { computed } from 'vue';
import type { MessageKey } from '@/shared/i18n/en';
import AppIcon from '@/shared/ui/AppIcon.vue';
import { ANSWER_COLORS, ANSWER_ICONS } from '@/shared/answers';
import { t } from '@/shared/i18n/i18n';

const props = defineProps<{
	counts: number[];
	correct: number[];
}>();

const total = computed(() => props.counts.reduce((sum, count) => sum + count, 0));
const max = computed(() => Math.max(1, ...props.counts));

const bars = computed(() => props.counts.map((count, index) => {
	const pct = total.value ? Math.round((count / total.value) * 100) : 0;

	return {
		index,
		count,
		pct,
		height: (count / max.value) * 100,
		correct: props.correct.includes(index),
		label: t('chart.bar', { shape: t(`shape.${index}` as MessageKey), n: count, pct }),
	};
}));

const summary = computed(() => bars.value.map((bar) => bar.label).join(', '));
</script>

<template>
	<!-- Colour = answer identity (same as the tiles). The palette fails the CVD/contrast checks on some pairs,
	     so every bar also carries its shape symbol, a direct count label in text ink and a thin outline. -->
	<figure class="chart" role="img" :aria-label="t('chart.label', { summary })">
		<div
			v-for="bar in bars"
			:key="bar.index"
			class="column"
			:class="{ correct: bar.correct }"
			:style="{ '--bar-color': ANSWER_COLORS[bar.index] }"
			:title="bar.label"
		>
			<span class="value">
				<strong>{{ bar.count }}</strong>
				<span class="pct">{{ bar.pct }}%</span>
			</span>
			<div class="track">
				<div class="bar" :style="{ height: `${bar.height}%` }"></div>
			</div>
			<span class="key">
				<span class="symbol"><AppIcon :name="ANSWER_ICONS[bar.index]" /></span>
				<svg v-if="bar.correct" class="check" viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="11" />
					<path d="M6.5 12.5l3.6 3.6 7.4-8" />
				</svg>
			</span>
		</div>
	</figure>
</template>

<style scoped>
.chart {
	display: flex;
	align-items: stretch;
	justify-content: center;
	gap: clamp(0.5rem, 2vw, 1.75rem);
	height: 100%;
	min-height: 10rem;
	margin: 0;
	padding: 0 clamp(0.5rem, 2vw, 1.5rem);
}

.column {
	display: flex;
	flex: 0 1 clamp(3.5rem, 9vw, 8rem);
	flex-direction: column;
	align-items: center;
	gap: 0.4rem;
	min-width: 0;
}

.value {
	display: flex;
	align-items: baseline;
	gap: 0.3rem;
	color: var(--text);
	line-height: 1;
}

.value strong {
	font-size: clamp(1.4rem, 3.2vw, 2.6rem);
}

.pct {
	color: var(--text-muted);
	font-size: clamp(0.8rem, 1.4vw, 1.1rem);
	font-weight: 600;
}

.track {
	display: flex;
	flex: 1;
	align-items: flex-end;
	width: 100%;
	border-bottom: 2px solid var(--border);
}

.bar {
	width: 100%;
	min-height: 0.25rem;
	border-radius: 4px 4px 0 0;
	background: var(--bar-color);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bar-color) 70%, black);
	transform-origin: bottom;
	animation: grow 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	transition: height 0.4s ease;
}

.column:not(.correct) .bar {
	opacity: 0.45;
}

.key {
	position: relative;
	display: grid;
	place-items: center;
	width: clamp(2.2rem, 4.5vw, 3.4rem);
	aspect-ratio: 1;
	border-radius: 50%;
	background: var(--bar-color);
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--bar-color) 55%, black);
	color: var(--on-color);
	font-size: clamp(1rem, 2.2vw, 1.6rem);
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.check {
	position: absolute;
	right: -0.7rem;
	bottom: -0.55rem;
	width: 1.3em;
	height: 1.3em;
	overflow: visible;
	filter: drop-shadow(0 0.12em 0 color-mix(in srgb, var(--color-4) 50%, black));
	animation: check-pop 0.5s 0.4s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}

.check circle {
	fill: var(--color-4);
	stroke: var(--surface);
	stroke-width: 2.5;
}

.check path {
	fill: none;
	stroke: var(--on-color);
	stroke-width: 3.2;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-dasharray: 20;
	animation: check-draw 0.35s 0.75s ease-out both;
}

@keyframes check-pop {
	from {
		transform: scale(0) rotate(-45deg);
	}
}

@keyframes check-draw {
	from {
		stroke-dashoffset: 20;
	}
}

@keyframes grow {
	from {
		transform: scaleY(0);
	}
}
</style>
