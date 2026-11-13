<script setup lang="ts">
// Reveal mode + countdown, shared by the quiz editor and the host's live settings popup.
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import UnitInput from '@/views/components/utils/form/UnitInput.vue';
import type { RevealMode } from '@/interfaces/Quiz/QuizInterface';
import { t } from '@/i18n';

const revealMode = defineModel<RevealMode>('revealMode', { required: true });
const countdown = defineModel<number>('countdown', { required: true });

const MAX_COUNTDOWN = 10;

// Out-of-range or empty input snaps back to the current value instead of being kept.
const onCountdownChange = (event: Event): void => {
	const input = event.target as HTMLInputElement;
	const seconds = Number(input.value);
	if (input.value !== '' && Number.isInteger(seconds) && seconds >= 0 && seconds <= MAX_COUNTDOWN) {
		countdown.value = seconds;
	} else {
		input.value = String(countdown.value);
	}
};
</script>

<template>
	<fieldset class="reveal">
		<legend>{{ t('editor.reveal') }}<InfoTip :text="t('editor.revealInfo')" /></legend>
		<label class="option">
			<input v-model="revealMode" type="radio" value="question" />
			{{ t('editor.revealQuestion') }}
		</label>
		<label class="option">
			<input v-model="revealMode" type="radio" value="end" />
			{{ t('editor.revealEnd') }}
		</label>
	</fieldset>
	<label>
		{{ t('editor.countdown') }}<InfoTip :text="t('editor.countdownInfo')" />
		<UnitInput unit="s" min="0" :max="MAX_COUNTDOWN" :model-value="countdown" required @change="onCountdownChange" />
	</label>
</template>

<style scoped>
.reveal {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	border: none;
}

.reveal legend {
	margin-bottom: 0.5rem;
	font-weight: 500;
}

.option {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 400;
	cursor: pointer;
}
</style>
