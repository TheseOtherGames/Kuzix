<script setup lang="ts">
import { computed } from 'vue';
import { tagLook } from '@/shared/avatars';

const props = defineProps<{
	name: string;
	/** The player's avatar string, which carries the tag colour and name style. */
	look: string;
}>();

const tag = computed(() => tagLook(props.look));
// Wave animates each letter, so it needs one span per character (Array.from keeps emoji whole).
const letters = computed(() => (tag.value.style === 'wave' ? Array.from(props.name) : []));
</script>

<template>
	<span
		class="name-tag"
		:class="[tag.style && `style-${tag.style}`, tag.shape && `design-${tag.shape}`, { classic: !tag.color.id, shade: tag.color.shade }]"
		:style="{ '--tag-bg': tag.color.bg, '--tag-ink': tag.color.ink }"
	>
		<template v-if="letters.length">
			<span v-for="(letter, i) in letters" :key="i" class="letter" :style="{ animationDelay: `${i * 0.08}s` }">{{ letter }}</span>
		</template>
		<template v-else>{{ name }}</template>
	</span>
</template>

<style scoped>
.name-tag {
	display: inline-block;
	max-width: 100%;
	padding: 0.15em 0.65em;
	border-radius: 999px;
	background: var(--tag-bg);
	color: var(--tag-ink);
	font-weight: 700;
	line-height: 1.25;
	overflow: hidden;
	text-overflow: ellipsis;
	vertical-align: middle;
	white-space: nowrap;
}

.classic {
	box-shadow: inset 0 0 0 1.5px var(--border);
}

.shade {
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}

.style-caps {
	font-size: 0.9em;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.style-italic {
	font-style: italic;
}

.style-mono {
	font-family: var(--font-mono);
	font-size: 0.92em;
	letter-spacing: -0.02em;
}

/* The glow is blended toward white so dark text gets a bright halo instead of a smudge. */
.style-glow {
	--glow: color-mix(in srgb, var(--tag-ink) 30%, white);
	text-shadow: 0 0 0.3em var(--glow), 0 0 0.7em color-mix(in srgb, var(--glow) 60%, transparent);
}

.style-pop {
	text-shadow: 0.06em 0.06em 0 rgba(0, 0, 0, 0.3), 0.12em 0.12em 0 rgba(0, 0, 0, 0.18);
}

.shade.style-pop,
.shade.style-glow {
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55), 0.08em 0.08em 0 rgba(0, 0, 0, 0.3);
}

.style-sparkle::before,
.style-sparkle::after {
	content: '';
	display: inline-block;
	width: 1em;
	height: 1em;
	background: url('@/shared/icons/sparkles.svg') center / contain no-repeat;
	vertical-align: -0.1em;
	font-size: 0.8em;
	animation: twinkle 1.6s ease-in-out infinite;
}

.style-sparkle::before {
	margin-right: 0.25em;
}

.style-sparkle::after {
	margin-left: 0.25em;
	animation-delay: 0.8s;
}

.letter {
	display: inline-block;
	white-space: pre;
	animation: wave 1.4s ease-in-out infinite;
}

/* Animations (the global prefers-reduced-motion rule stops them). */
.style-shimmer {
	background:
		linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.55) 50%, transparent 65%) 0 0 / 250% 100% no-repeat,
		var(--tag-bg);
	animation: shimmer 2.4s ease-in-out infinite;
}

.style-pulse {
	animation: pulse 1.2s ease-in-out infinite;
}

.style-jelly {
	animation: jelly 2s ease-in-out infinite;
}

.style-flicker {
	animation: flicker 3s linear infinite;
}

.style-hue {
	animation: hue 4s linear infinite;
}

/* Shapes. `rotate` (not `transform`) so the sticker tilt adds to the pulse/jelly animations. */
.design-sticker {
	border: 0.12em solid var(--on-color);
	box-shadow: 0 0.15em 0 rgba(0, 0, 0, 0.3);
	rotate: -4deg;
}

.design-ribbon {
	padding-inline: 1.15em;
	border-radius: 0;
	clip-path: polygon(0 0, 100% 0, calc(100% - 0.5em) 50%, 100% 100%, 0 100%, 0.5em 50%);
}

.design-label {
	padding-left: 1.3em;
	border-radius: 0 0.35em 0.35em 0;
	clip-path: polygon(0.75em 0, 100% 0, 100% 100%, 0.75em 100%, 0 50%);
}

.design-label::before {
	content: '';
	display: inline-block;
	width: 0.32em;
	height: 0.32em;
	margin: 0 0.35em 0.1em -0.75em;
	border-radius: 50%;
	background: var(--surface);
	vertical-align: middle;
}

.design-pixel {
	border-radius: 0;
	clip-path: polygon(
		0 0.25em, 0.25em 0.25em, 0.25em 0, calc(100% - 0.25em) 0, calc(100% - 0.25em) 0.25em, 100% 0.25em,
		100% calc(100% - 0.25em), calc(100% - 0.25em) calc(100% - 0.25em), calc(100% - 0.25em) 100%,
		0.25em 100%, 0.25em calc(100% - 0.25em), 0 calc(100% - 0.25em)
	);
}

/* Colour as a ring around a surface-coloured tag; text uses the page ink. */
.name-tag.design-outline {
	border: 0.15em solid transparent;
	background: linear-gradient(var(--surface), var(--surface)) padding-box, var(--tag-bg) border-box;
	color: var(--text);
	text-shadow: none;
}

.classic.design-outline {
	border-color: var(--border);
}

@keyframes shimmer {
	from {
		background-position: 150% 0, 0 0;
	}

	to {
		background-position: -50% 0, 0 0;
	}
}

@keyframes pulse {
	50% {
		transform: scale(1.07);
	}
}

@keyframes jelly {
	0%,
	60%,
	100% {
		transform: scale(1, 1);
	}

	15% {
		transform: scale(1.12, 0.88);
	}

	30% {
		transform: scale(0.92, 1.08);
	}

	45% {
		transform: scale(1.04, 0.96);
	}
}

@keyframes flicker {
	0%,
	18%,
	22%,
	62%,
	64%,
	100% {
		text-shadow: 0 0 0.3em color-mix(in srgb, var(--tag-ink) 30%, white), 0 0 0.8em color-mix(in srgb, var(--tag-ink) 20%, rgba(255, 255, 255, 0.6));
	}

	20%,
	63% {
		text-shadow: none;
		opacity: 0.75;
	}
}

@keyframes hue {
	to {
		filter: hue-rotate(360deg);
	}
}

@keyframes wave {
	0%,
	60%,
	100% {
		transform: translateY(0);
	}

	30% {
		transform: translateY(-0.18em);
	}
}

@keyframes twinkle {
	50% {
		transform: scale(0.7) rotate(20deg);
		opacity: 0.6;
	}
}
</style>
