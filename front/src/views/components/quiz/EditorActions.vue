<script setup lang="ts">
// Lives inside the editor <form>: the save button submits it.
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import { t } from '@/i18n';

defineProps<{ dirty: boolean; saving: boolean; canAdd: boolean }>();
const emit = defineEmits<{ add: []; undo: [] }>();
</script>

<template>
	<div class="actions">
		<BaseButton variant="secondary" block :disabled="!canAdd" @click="emit('add')"><AppIcon name="plus" /> {{ t('editor.add') }}</BaseButton>
		<div v-if="dirty" class="unsaved" role="status">
			<span class="unsaved-icon"><AppIcon name="pencil" /></span>
			<strong>{{ t('pf.unsaved') }}</strong>
			<BaseButton variant="ghost" size="sm" :disabled="saving" :title="t('pf.undo')" @click="emit('undo')"><AppIcon name="undo" /></BaseButton>
		</div>
		<div class="row">
			<BaseButton variant="ghost" to="/dashboard">{{ t('common.cancel') }}</BaseButton>
			<BaseButton type="submit" variant="success" :disabled="!dirty" :loading="saving">{{ t('editor.save') }}</BaseButton>
		</div>
	</div>
</template>

<style scoped>
.actions {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}

.unsaved {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.4rem 0.4rem 0.4rem 0.5rem;
	border: 2px solid var(--color-3);
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow), 0 0 0 4px color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: nudge 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.unsaved strong {
	flex: 1;
	font-size: 0.95rem;
}

.unsaved-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-3) 25%, transparent);
	animation: wobble 1.6s ease-in-out infinite;
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

.row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.6rem;
}

/* Narrow editor: a sticky bottom bar after the questions. */
@media (max-width: 900px) {
	.actions {
		position: sticky;
		bottom: 0;
		z-index: 5;
		order: 1;
		padding: 1rem 0;
		background: linear-gradient(transparent, var(--bg) 30%);
	}
}
</style>
