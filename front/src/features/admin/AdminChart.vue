<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@/shared/i18n/i18n';

// One series per chart (never two scales on one axis): render it twice for two measures.
const props = defineProps<{
	title: string;
	points: { day: string; value: number }[];
	color: string;
}>();

const max = computed(() => Math.max(1, ...props.points.map((point) => point.value)));
const total = computed(() => props.points.reduce((sum, point) => sum + point.value, 0));
const dayLabel = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString(locale.value, { day: 'numeric', month: 'short' });
const summary = computed(() => props.points.map((point) => `${dayLabel(point.day)}: ${point.value}`).join(', '));
</script>

<template>
	<figure class="chart admin-panel" :style="{ '--bar': color }">
		<figcaption>
			<span>{{ title }}</span>
			<strong>{{ total.toLocaleString(locale) }}</strong>
		</figcaption>
		<div class="plot" role="img" :aria-label="`${title}: ${summary}`">
			<span class="max">{{ max }}</span>
			<div
				v-for="point in points"
				:key="point.day"
				class="col"
				:data-tip="`${dayLabel(point.day)} · ${point.value}`"
			>
				<span class="bar" :style="{ height: `${(point.value / max) * 100}%` }" />
			</div>
		</div>
		<div class="axis">
			<span>{{ dayLabel(points[0]?.day ?? '') }}</span>
			<span>{{ dayLabel(points.at(-1)?.day ?? '') }}</span>
		</div>
	</figure>
</template>

<style scoped>
.chart {
	margin: 0;
	padding: 1rem 1.1rem;
}

figcaption {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 0.75rem;
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 600;
}

figcaption strong {
	color: var(--text);
	font-size: 1.3rem;
	font-variant-numeric: tabular-nums;
}

.plot {
	position: relative;
	display: flex;
	align-items: flex-end;
	gap: 2px;
	height: 8rem;
	border-bottom: 1px solid var(--border);
	background: linear-gradient(var(--border) 1px, transparent 1px) top / 100% 50%;
}

.max {
	position: absolute;
	top: -0.1rem;
	left: 0;
	padding-right: 0.3rem;
	background: var(--surface);
	color: var(--text-muted);
	font-size: 0.7rem;
	line-height: 1;
	transform: translateY(-50%);
}

/* The whole column is the hover target, bigger than the bar itself. */
.col {
	display: flex;
	flex: 1;
	align-items: flex-end;
	height: 100%;
}

.bar {
	width: 100%;
	min-height: 1px;
	border-radius: 4px 4px 0 0;
	background: var(--bar);
	transition: height 0.4s, opacity 0.15s;
}

.plot:hover .col:not(:hover) .bar {
	opacity: 0.45;
}

.axis {
	display: flex;
	justify-content: space-between;
	margin-top: 0.35rem;
	color: var(--text-muted);
	font-size: 0.75rem;
}
</style>
