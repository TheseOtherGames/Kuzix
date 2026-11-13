<script setup lang="ts">
import { getCurrentInstance, onMounted, onUpdated, useAttrs } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

withDefaults(defineProps<{
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
	size?: 'sm' | 'md' | 'lg';
	to?: RouteLocationRaw;
	href?: string;
	type?: 'button' | 'submit';
	block?: boolean;
	disabled?: boolean;
	loading?: boolean;
}>(), {
	variant: 'primary',
	size: 'md',
	type: 'button',
});

// Every button gets a hover title: an explicit `title` (or `data-tip` tooltip) wins, otherwise the button's own text.
const attrs = useAttrs();
const instance = getCurrentInstance();
function syncTitle() {
	if (attrs.title || attrs['data-tip']) return;
	const el = instance?.proxy?.$el as HTMLElement | undefined;
	if (el) el.title = el.textContent?.trim() ?? '';
}
onMounted(syncTitle);
onUpdated(syncTitle);
</script>

<template>
	<RouterLink v-if="to" :to="to" class="btn" :class="[variant, size, { block }]">
		<slot />
	</RouterLink>
	<a v-else-if="href" :href="href" class="btn" :class="[variant, size, { block }]">
		<slot />
	</a>
	<button v-else :type="type" class="btn" :class="[variant, size, { block }]" :disabled="disabled || loading">
		<span v-if="loading" class="spinner" aria-hidden="true"></span>
		<slot />
	</button>
</template>

<style scoped>
.btn {
	--btn-color: var(--accent);
	--btn-on: var(--on-accent);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.65rem 1.25rem;
	border: none;
	border-radius: 999px;
	background: var(--btn-color);
	color: var(--btn-on);
	font-weight: 600;
	text-decoration: none;
	cursor: pointer;
	box-shadow: 0 0.25rem 0 color-mix(in srgb, var(--btn-color) 60%, black);
	transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
	white-space: nowrap;
}

/* Icons fill more of the button; the negative margin keeps the button height. */
:slotted(.app-icon) {
	font-size: 1.45em;
	margin-block: -0.3em;
}

.btn:hover:not(:disabled) {
	filter: brightness(1.12);
	transform: translateY(-0.12rem);
	box-shadow: 0 0.37rem 0 color-mix(in srgb, var(--btn-color) 60%, black);
}

.btn:active:not(:disabled) {
	transform: translateY(0.2rem);
	box-shadow: 0 0.05rem 0 color-mix(in srgb, var(--btn-color) 60%, black);
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.secondary {
	--btn-color: var(--btn-secondary);
	--btn-on: var(--on-color);
}

.danger {
	--btn-color: var(--btn-danger);
	--btn-on: var(--on-color);
}

.success {
	--btn-color: var(--btn-success);
	--btn-on: var(--on-color);
}

.ghost {
	background: transparent;
	color: var(--text);
	box-shadow: inset 0 0 0 2px var(--border);
}

.ghost:hover:not(:disabled) {
	background: var(--surface-2);
	box-shadow: inset 0 0 0 2px var(--accent-line);
	filter: none;
}

.ghost:active:not(:disabled) {
	box-shadow: inset 0 0 0 2px var(--border);
}

.sm {
	padding: 0.4rem 0.9rem;
	font-size: 0.875rem;
}

.lg {
	padding: 0.9rem 1.75rem;
	font-size: 1.2rem;
}

.block {
	width: 100%;
}

.spinner {
	width: 1em;
	height: 1em;
	border: 2px solid currentColor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
