<script setup lang="ts">
import { dismissToast, toasts } from '@/utils/Toast';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

const ICONS = { success: 'check', error: 'cross', info: 'info' };
</script>

<template>
	<div class="toasts" aria-live="polite">
		<TransitionGroup name="toast">
			<button
				v-for="entry in toasts"
				:key="entry.id"
				type="button"
				class="toast"
				:class="entry.type"
				@click="dismissToast(entry.id)"
			>
				<AppIcon class="icon" :name="ICONS[entry.type]" />
				{{ entry.message }}
			</button>
		</TransitionGroup>
	</div>
</template>

<style scoped>
.toasts {
	position: fixed;
	right: 1rem;
	bottom: 1rem;
	left: 1rem;
	z-index: 200;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	pointer-events: none;
}

.toast {
	--toast-color: var(--info);
	display: flex;
	align-items: center;
	gap: 0.6rem;
	max-width: 26rem;
	padding: 0.75rem 1.1rem;
	border: none;
	border-left: 0.4rem solid var(--toast-color);
	border-radius: var(--radius-sm);
	background: var(--surface);
	box-shadow: var(--shadow);
	text-align: left;
	cursor: pointer;
	pointer-events: auto;
}

.success {
	--toast-color: var(--success);
}

.error {
	--toast-color: var(--danger);
}

.icon {
	color: var(--toast-color);
	font-weight: 700;
}

.toast-enter-active,
.toast-leave-active {
	transition: all 0.25s;
}

.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateY(1rem);
}

@media (min-width: 640px) {
	.toasts {
		left: auto;
		align-items: flex-end;
	}
}
</style>
