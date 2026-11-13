<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router';

// A link when `to` is set, otherwise a button (listen with @click).
defineProps<{
	to?: RouteLocationRaw;
	label: string;
	// Same colours as BaseButton's variants; leave it out for the neutral nav pill.
	variant?: 'secondary' | 'success';
}>();
</script>

<template>
	<component :is="to ? RouterLink : 'button'" :to="to" :type="to ? undefined : 'button'" class="pill" :class="variant" :data-tip="label" :aria-label="label">
		<span class="pill-icon" aria-hidden="true"><slot /></span>
		<span class="pill-label">{{ label }}</span>
	</component>
</template>

<style scoped>
.pill {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.5rem;
	height: 2.5rem;
	padding: 0 1rem 0 0.3rem;
	border: none;
	border-radius: 999px;
	background: var(--surface-2);
	color: var(--text);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
	text-decoration: none;
	white-space: nowrap;
	transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.pill-icon {
	display: grid;
	place-items: center;
	width: 1.95rem;
	height: 1.95rem;
	border-radius: 50%;
	background: var(--surface);
	/* Inset so the 3D edge stays inside the circle: an outer drop shadow made it look lower than the pill's centre. */
	box-shadow: inset 0 -0.15rem 0 color-mix(in srgb, var(--surface) 80%, black);
	font-size: 1.1rem;
	line-height: 1;
	transition: transform 0.2s;
}

/* Inline SVGs (AvatarIcon) sit on the text baseline otherwise, which pushes them off-centre. */
:slotted(svg) {
	display: block;
}

:slotted(.app-icon) {
	font-size: 1.3em;
}

.pill:hover,
.pill.router-link-active {
	background: color-mix(in srgb, var(--accent) 22%, var(--surface));
	box-shadow: inset 0 0 0 2px var(--accent-line);
}

.pill.is-back:hover .pill-icon {
	transform: translateX(-0.2rem);
}

.pill.is-close:hover .pill-icon {
	transform: rotate(90deg);
}

.secondary,
.success {
	background: var(--pill-bg);
	color: var(--on-color);
}

.secondary {
	--pill-bg: var(--btn-secondary);
}

.success {
	--pill-bg: var(--btn-success);
}

.secondary:hover,
.success:hover {
	background: color-mix(in srgb, var(--pill-bg) 85%, black);
	box-shadow: none;
}

@media (max-width: 640px) {
	.pill {
		padding-right: 0.3rem;
	}

	.pill-label {
		display: none;
	}
}
</style>
