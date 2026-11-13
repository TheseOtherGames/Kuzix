<script setup lang="ts">
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import NicknameInput from '@/views/components/utils/form/NicknameInput.vue';
import { t } from '@/i18n';

const nickname = defineModel<string>({ required: true });
const emit = defineEmits<{ submit: [] }>();
</script>

<template>
	<form class="screen" @submit.prevent="emit('submit')">
		<BaseCard accent="var(--color-4)" class="join">
			<h1>{{ t('play.whoAreYou') }}</h1>
			<NicknameInput v-model="nickname" :label="t('pf.nickname')" autofocus :placeholder="t('pf.nicknamePh')" />
			<p class="muted hint">{{ t('play.joinHint') }}</p>
			<BaseButton type="submit" size="lg" variant="success" block :disabled="!nickname.trim()">{{ t('play.join') }}</BaseButton>
		</BaseCard>
	</form>
</template>

<style scoped>
.screen {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 1.5rem 1rem;
}

.join {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	width: min(100%, 28rem);
}

.hint {
	margin: 0;
	font-size: 0.9rem;
}
</style>
