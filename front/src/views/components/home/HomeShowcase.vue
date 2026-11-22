<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import { onBeforeUnmount, ref, watch } from 'vue';

// Files in front/public/screenshots, retaken with the run-app skill when the UI changes.
const SHOTS = [
	'host',
	'player',
	'lobby',
	'results',
];

// Clicked screenshot shown fullscreen; any click or Escape closes it.
const zoomed = ref<string | null>(null);

const onKeydown = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') {
		zoomed.value = null;
	}
};

watch(zoomed, (shot) => {
	if (shot) {
		window.addEventListener('keydown', onKeydown);
	} else {
		window.removeEventListener('keydown', onKeydown);
	}
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
	<div class="shots">
		<figure v-for="shot in SHOTS" :key="shot" :class="shot">
			<button type="button" class="zoom" @click="zoomed = shot">
				<img :src="`/screenshots/${shot}.webp`" :alt="t(`home.shot.${shot}` as MessageKey)" loading="lazy" />
			</button>
			<figcaption class="muted">{{ t(`home.shot.${shot}` as MessageKey) }}</figcaption>
		</figure>
	</div>

	<Teleport to="body">
		<Transition name="lightbox">
			<div v-if="zoomed" class="lightbox" :class="zoomed" role="dialog" aria-modal="true" @click="zoomed = null">
				<img :src="`/screenshots/${zoomed}.webp`" :alt="t(`home.shot.${zoomed}` as MessageKey)" />
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
/* Desktop: host (3/4) + phone (1/4), then lobby and results side by side. Phone: one column. */
.shots {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1.5rem;
	align-items: start;
}

figure {
	grid-column: span 2;
	margin: 0;
}

.host {
	grid-column: span 3;
}

.player {
	grid-column: span 1;
}

.zoom {
	display: block;
	width: 100%;
	padding: 0;
	border: none;
	background: none;
	cursor: zoom-in;
}

.zoom img {
	transition: transform 0.15s;
}

.zoom:hover img {
	transform: translateY(-0.2rem);
}

/* Ring on the image itself (follows its rounded corners) instead of the full-width button box. */
.zoom:focus-visible {
	outline: none;
}

.zoom:focus-visible img {
	outline: 2px solid var(--focus-ring);
	outline-offset: 2px;
}

img {
	display: block;
	width: 100%;
	height: auto;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--border) 55%, black);
}

.player img {
	max-width: 16rem;
	margin-inline: auto;
	border-radius: 1.5rem;
}

figcaption {
	margin-top: 0.6rem;
	font-size: 0.9rem;
	text-align: center;
}

.lightbox {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: grid;
	place-items: center;
	padding: 1rem;
	background: rgba(8, 12, 20, 0.8);
	backdrop-filter: blur(4px);
	cursor: zoom-out;
}

.lightbox img {
	width: auto;
	max-width: 100%;
	max-height: calc(100dvh - 2rem);
}

.lightbox.player img {
	max-width: 100%;
	border-radius: 1.5rem;
}

.lightbox-enter-active,
.lightbox-leave-active {
	transition: opacity 0.2s;
}

.lightbox-enter-from,
.lightbox-leave-to {
	opacity: 0;
}

@media (max-width: 760px) {
	figure,
	.host,
	.player {
		grid-column: 1 / -1;
	}
}
</style>
