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
						<button type="button" class="close" :aria-label="t('common.close')" @click="emit('close')">✕</button>
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
	max-height: calc(100vh - 2rem);
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
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.close {
	border: none;
	background: none;
	font-size: 1.25rem;
	cursor: pointer;
	color: var(--text-muted);
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
