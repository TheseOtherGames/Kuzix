<script setup lang="ts">
import CountdownNumber from '@/views/components/game/CountdownNumber.vue';
import { t } from '@/i18n';

defineProps<{
	index: number;
	total: number;
	remainingMs: number;
	running: boolean;
	projected?: boolean;
}>();
</script>

<template>
	<section class="countdown-screen" :class="{ projected }">
		<p class="label muted">{{ t('host.questionOf', { n: index + 1, total }) }}</p>
		<CountdownNumber :remaining-ms="remainingMs" :running="running" />
		<h1 class="ready">{{ t('host.getReady') }}</h1>
	</section>
</template>

<style scoped>
.countdown-screen {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1.5rem 1rem;
	text-align: center;
	animation: pop 0.35s ease-out;
}

.projected {
	gap: clamp(1rem, 3vh, 2rem);
	padding: 0;
	animation: none;
}

.projected .label {
	margin: 0;
	font-size: clamp(1.3rem, 3vw, 2.4rem);
	font-weight: 700;
}

.projected .ready {
	margin: 0;
	font-size: clamp(2rem, 5vw, 4rem);
}

@keyframes pop {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
}
</style>
