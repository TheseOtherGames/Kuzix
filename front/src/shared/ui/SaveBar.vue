<script setup lang="ts">
import AppIcon from './AppIcon.vue';
import BaseButton from './BaseButton.vue';
import { t } from '../i18n/i18n';

// Must sit inside the <form> it saves: the Save button submits it.
defineProps<{
	dirty: boolean;
	saving?: boolean;
	/** Briefly true after a successful save: green confirmation. */
	saved?: boolean;
}>();

const emit = defineEmits<{ undo: [] }>();
</script>

<template>
	<div class="save-bar" :class="{ dirty, saved: saved && !dirty }" role="status">
		<span class="save-icon"><AppIcon :name="dirty ? 'pencil' : 'check'" /></span>
		<span class="save-text">
			<strong>{{ dirty ? t('pf.unsaved') : t('pf.saved') }}</strong>
			<small v-if="dirty">{{ t('pf.unsavedText') }}</small>
		</span>
		<BaseButton v-if="dirty" variant="ghost" :disabled="saving" @click="emit('undo')"><AppIcon name="undo" /> {{ t('pf.undo') }}</BaseButton>
		<BaseButton type="submit" :disabled="!dirty" :loading="saving"><AppIcon name="save" /> {{ t('common.save') }}</BaseButton>
	</div>
</template>

<style scoped>
/* Pinned to the bottom of the screen only while there is something to save. */
.save-bar {
	position: relative;
	bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
	z-index: 2;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.6rem 1rem;
	padding: 0.75rem 0.9rem;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	transition: border-color 0.2s, box-shadow 0.2s;
}

.save-bar.dirty {
	position: sticky;
	border-color: var(--color-3);
	box-shadow: var(--shadow), 0 0 0 4px color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: nudge 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.save-bar.saved {
	border-color: var(--success);
}

.save-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	background: var(--surface-2);
	color: var(--success);
	font-weight: 700;
}

.dirty .save-icon {
	background: color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: wobble 1.6s ease-in-out infinite;
}

.save-text {
	display: flex;
	flex: 1 1 12rem;
	flex-direction: column;
	gap: 0.1rem;
	min-width: 0;
	color: var(--text-muted);
}

.dirty .save-text {
	color: var(--text);
}

.save-text small {
	color: var(--text-muted);
	font-size: 0.85rem;
}

@media (max-width: 560px) {
	.save-text small {
		display: none;
	}
}

@keyframes nudge {
	from {
		transform: translateY(0.6rem);
	}
}

@keyframes wobble {
	50% {
		transform: rotate(-12deg);
	}
}
</style>
