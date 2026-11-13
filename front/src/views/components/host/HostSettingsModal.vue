<script setup lang="ts">
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import GameSettingsFields from '@/views/components/quiz/GameSettingsFields.vue';
import type { RevealMode } from '@/interfaces/Quiz/QuizInterface';
import { t } from '@/i18n';

const props = defineProps<{
	open: boolean;
	revealMode: RevealMode;
	countdown: number;
}>();

const emit = defineEmits<{ close: []; change: [settings: { revealMode: RevealMode; countdown: number }] }>();

// Every change is sent straight away; the server echoes it back through the host state.
const send = (change: { revealMode?: RevealMode; countdown?: number }): void => {
	emit('change', { revealMode: change.revealMode ?? props.revealMode, countdown: change.countdown ?? props.countdown });
};
</script>

<template>
	<BaseModal :open="open" :title="t('host.settings')" @close="emit('close')">
		<div class="fields">
			<GameSettingsFields
				:reveal-mode="revealMode"
				:countdown="countdown"
				@update:reveal-mode="send({ revealMode: $event })"
				@update:countdown="send({ countdown: $event })"
			/>
		</div>
		<p class="muted hint">{{ t('host.settingsHint') }}</p>
		<template #actions>
			<BaseButton @click="emit('close')">{{ t('common.close') }}</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.fields {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.fields :deep(.with-unit) {
	max-width: 10rem;
}

.hint {
	margin: 1rem 0 0;
	font-size: 0.9rem;
}
</style>
