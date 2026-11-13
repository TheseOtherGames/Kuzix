<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { auth, PROVIDER_LABELS } from '@/utils/Auth';
import { t } from '@/i18n';

defineProps<{ exporting: boolean }>();
const emit = defineEmits<{ delete: []; export: [] }>();
</script>

<template>
	<BaseCard accent="var(--color-2)" class="account">
		<h2>{{ t('profile.account') }}</h2>
		<p v-if="auth.user?.email"><strong>{{ t('auth.email') }}</strong> <span class="selectable">{{ auth.user.email }}</span></p>
		<p>
			<strong>{{ t('profile.loginMethods') }}</strong>
			{{ auth.user?.providers.map((provider) => provider === 'password' ? t('profile.passwordLogin') : PROVIDER_LABELS[provider] ?? provider).join(', ') }}
		</p>
		<div class="actions">
			<BaseButton variant="tool" :loading="exporting" @click="emit('export')"><AppIcon name="download" /> {{ t('profile.exportData') }}</BaseButton>
			<BaseButton variant="tool-danger" @click="emit('delete')"><AppIcon name="trash" /> {{ t('profile.deleteAccount') }}</BaseButton>
		</div>
	</BaseCard>
</template>

<style scoped>
.account p {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin: 0.4rem 0 0;
	overflow-wrap: anywhere;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1rem;
}
</style>
