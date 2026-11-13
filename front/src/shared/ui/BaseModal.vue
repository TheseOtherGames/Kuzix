<script setup lang="ts">
import { t } from '../i18n/i18n';
import { onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
	open: boolean;
	title: string;
	wide?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const onKeydown = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') {
		emit('close');
	}
};

watch(() => props.open, (open) => {
	if (open) {
		window.addEventListener('keydown', onKeydown);
	} else {
		window.removeEventListener('keydown', onKeydown);
	}
}, { immediate: true });

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="open" class="backdrop" @click.self="emit('close')">
				<div class="modal" :class="{ wide }" role="dialog" aria-modal="true" :aria-label="title">
					<header class="header">
						<h2>{{ title }}</h2>
						<button type="button" class="close" :aria-label="t('common.close')" @click="emit('close')">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
						</button>
					</header>
					<div class="body">
						<slot />
					</div>
					<footer v-if="$slots.actions" class="actions">
						<slot name="actions" />
					</footer>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.backdrop {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: grid;
	place-items: center;
	padding: 1rem;
	background: rgba(8, 12, 20, 0.65);
	backdrop-filter: blur(4px);
}

.modal {
	width: min(100%, 28rem);
	max-height: calc(100dvh - 2rem);
	overflow: auto;
	padding: 1.5rem;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.modal.wide {
	width: min(100%, 44rem);
}

.header {
	/* Stays at the top of a long modal so the title and close button are always visible. */
	position: sticky;
	top: -1.5rem;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin: -1.5rem -1.5rem 0;
	padding: 1.5rem 1.5rem 0.75rem;
	background: var(--surface);
}

/* Same round button as the game bar, with the cross from its close pill. */
.close {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.25rem;
	height: 2.25rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--surface-2);
	color: var(--text);
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.close svg {
	width: 1.1rem;
	height: 1.1rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.6;
	stroke-linecap: round;
	transition: transform 0.2s;
}

.close:hover {
	background: var(--accent);
	color: var(--on-accent);
}

.close:hover svg {
	transform: rotate(90deg);
}

/* Stays at the bottom of a long modal so its buttons are always reachable. */
.actions {
	position: sticky;
	bottom: -1.5rem;
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.75rem;
	margin: 1.5rem -1.5rem -1.5rem;
	padding: 1rem 1.5rem 1.5rem;
	background: var(--surface);
}

/* Mobile: fullscreen on the dynamic viewport (dvh skips the browser bars), only the body scrolls. */
@media (max-width: 640px) {
	.backdrop {
		padding: 0;
	}

	.modal,
	.modal.wide {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100dvh;
		max-height: 100dvh;
		overflow: hidden;
		padding: 0;
		border-radius: 0;
	}

	.header {
		position: static;
		margin: 0;
		padding: calc(1rem + env(safe-area-inset-top)) 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.body {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
	}

	.actions {
		position: static;
		margin: 0;
		padding: 0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom));
		border-top: 1px solid var(--border);
	}

	.body:has(+ .actions) {
		padding-bottom: 1rem;
	}
}

.modal-enter-active,
.modal-leave-active {
	transition: opacity 0.2s;
}

.modal-enter-active .modal {
	animation: pop 0.25s ease-out;
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}

@keyframes pop {
	from {
		transform: scale(0.9);
	}
}
</style>
