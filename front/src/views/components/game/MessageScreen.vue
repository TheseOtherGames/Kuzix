<script setup lang="ts">
// Usage: <MessageScreen icon="check" :title :text>extra lines</MessageScreen>: one centred icon + title + text screen.
// `badge` puts the icon in a breathing accent circle (pause); `projected` scales it for the host's big screen.
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

defineProps<{
	icon: string;
	title: string;
	text?: string;
	badge?: boolean;
	projected?: boolean;
}>();
</script>

<template>
	<section class="message" :class="{ projected }">
		<span :class="badge ? 'badge' : 'big-icon'"><AppIcon :name="icon" /></span>
		<h1>{{ title }}</h1>
		<p v-if="text" class="muted">{{ text }}</p>
		<slot />
	</section>
</template>

<style scoped>
.message {
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

.big-icon {
	font-size: 5rem;
	line-height: 1.1;
}

.badge {
	display: grid;
	place-items: center;
	width: 6rem;
	aspect-ratio: 1;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--accent) 55%, black);
	color: var(--on-accent);
	font-size: 3rem;
	animation: breathe 2s ease-in-out infinite;
}

.projected {
	gap: 0.75rem;
	padding: 2rem;
	animation: none;
}

.projected h1 {
	font-size: clamp(2rem, 5vw, 4rem);
}

.projected .muted {
	font-size: clamp(1rem, 2vw, 1.5rem);
}

.projected .badge {
	width: clamp(6rem, 18vw, 11rem);
	box-shadow: 0 0.4rem 0 color-mix(in srgb, var(--accent) 55%, black);
	font-size: clamp(3rem, 9vw, 5.5rem);
}

/* Score lines slotted by the result and end screens. */
:slotted(.points) {
	margin: 0;
	font-size: 2.5rem;
	font-weight: 700;
}

:slotted(.points.good) {
	color: var(--success);
}

@keyframes breathe {
	50% {
		transform: scale(1.06);
	}
}

@keyframes pop {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
}
</style>
