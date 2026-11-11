<script setup lang="ts">
import { t } from '../../shared/i18n/i18n';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
	remainingMs: number;
	duration: number;
	running: boolean;
	size?: 'sm' | 'lg';
}>();

const now = ref(Date.now());
const endsAt = ref(Date.now() + props.remainingMs);
let frame = 0;

const tick = (): void => {
	now.value = Date.now();
	if (props.running && now.value < endsAt.value) {
		frame = requestAnimationFrame(tick);
	}
};

watch(() => [props.remainingMs, props.running], () => {
	endsAt.value = Date.now() + props.remainingMs;
	cancelAnimationFrame(frame);
	tick();
}, { immediate: true });

onBeforeUnmount(() => cancelAnimationFrame(frame));

const left = computed(() => (props.running ? Math.max(0, endsAt.value - now.value) : 0));
const seconds = computed(() => Math.ceil(left.value / 1000));
const progress = computed(() => left.value / (props.duration * 1000));
const color = computed(() => {
	if (progress.value > 0.5) {
		return 'var(--color-4)';
	}
	return progress.value > 0.2 ? 'var(--color-3)' : 'var(--color-1)';
});
</script>

<template>
	<div class="timer" :class="size ?? 'lg'" role="timer" :aria-label="t('common.secondsLeft', { n: seconds })">
		<svg viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r="44" class="track" />
			<circle
				cx="50"
				cy="50"
				r="44"
				class="bar"
				:stroke="color"
				:stroke-dasharray="276.5"
				:stroke-dashoffset="276.5 * (1 - progress)"
			/>
		</svg>
		<span class="value" :class="{ urgent: seconds <= 5 && running }">{{ seconds }}</span>
	</div>
</template>

<style scoped>
.timer {
	position: relative;
	display: grid;
	place-items: center;
	flex-shrink: 0;
}

.lg {
	width: 6rem;
	height: 6rem;
	font-size: 2rem;
}

.sm {
	width: 3.5rem;
	height: 3.5rem;
	font-size: 1.2rem;
}

svg {
	position: absolute;
	inset: 0;
	transform: rotate(-90deg);
}

circle {
	fill: none;
	stroke-width: 10;
}

.track {
	stroke: var(--surface-2);
}

.bar {
	stroke-linecap: round;
	transition: stroke 0.3s;
}

.value {
	font-weight: 700;
}

.urgent {
	color: var(--danger);
	animation: pulse 1s infinite;
}

@keyframes pulse {
	50% {
		transform: scale(1.2);
	}
}
</style>
