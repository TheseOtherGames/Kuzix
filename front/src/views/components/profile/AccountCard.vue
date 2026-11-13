<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { auth, PROVIDER_LABELS } from '@/utils/Auth';
import { t } from '@/i18n';
</script>

<template>
	<BaseCard accent="var(--color-2)" class="account">
		<h2>{{ t('profile.account') }}</h2>
		<p v-if="auth.user?.email"><strong>{{ t('auth.email') }}</strong> <span class="selectable">{{ auth.user.email }}</span></p>
		<p>
			<strong>{{ t('profile.loginMethods') }}</strong>
			{{ auth.user?.providers.map((provider) => provider === 'password' ? t('profile.passwordLogin') : PROVIDER_LABELS[provider] ?? provider).join(', ') }}
		</p>
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
</style>
