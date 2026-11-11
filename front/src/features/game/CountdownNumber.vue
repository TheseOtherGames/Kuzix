<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const TICK_MS = 100;

const props = defineProps<{
	remainingMs: number;
	running: boolean;
}>();

// Counts down locally from the server's remainingMs, like TimerRing: no dependence on the client clock.
const now = ref(Date.now());
const endsAt = ref(Date.now() + props.remainingMs);
let timer: ReturnType<typeof setInterval> | null = null;

watch(() => [props.remainingMs, props.running], () => {
	endsAt.value = Date.now() + props.remainingMs;
	now.value = Date.now();
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	if (props.running) {
		timer = setInterval(() => {
			now.value = Date.now();
		}, TICK_MS);
	}
}, { immediate: true });

onBeforeUnmount(() => {
	if (timer) {
		clearInterval(timer);
	}
});

const seconds = computed(() => Math.max(1, Math.ceil((endsAt.value - now.value) / 1000)));
</script>

<template>
	<div class="countdown" role="timer" :aria-label="String(seconds)">
		<Transition name="tick" mode="out-in">
			<span :key="seconds" class="number">{{ seconds }}</span>
		</Transition>
	</div>
</template>

<style scoped>
.countdown {
	display: grid;
	place-items: center;
	width: clamp(8rem, 26vmin, 16rem);
	aspect-ratio: 1;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0.5rem 0 color-mix(in srgb, var(--accent) 55%, black), 0 0 0 0.6rem color-mix(in srgb, var(--accent) 25%, transparent);
	color: var(--on-accent);
}

.number {
	font-size: clamp(4rem, 15vmin, 9rem);
	font-weight: 700;
	line-height: 1;
}

.tick-enter-active {
	animation: pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.4);
}

.tick-leave-active {
	transition: opacity 0.12s, transform 0.12s;
}

.tick-leave-to {
	opacity: 0;
	transform: scale(0.6);
}

@keyframes pop {
	from {
		opacity: 0;
		transform: scale(1.8);
	}
}
</style>
