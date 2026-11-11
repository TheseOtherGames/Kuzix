<script setup lang="ts">
import { t } from '../../shared/i18n/i18n';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { login } from './auth.store';
import { toast } from '../../shared/toast.store';

const router = useRouter();

onMounted(async () => {
	const params = new URLSearchParams(location.hash.slice(1));
	const token = params.get('token');
	if (token) {
		await login(token);
		toast.success(t('auth.loggedIn'));
		router.replace('/profile');
	} else {
		toast.error(params.get('error') ?? t('auth.loginFailed'));
		router.replace('/login');
	}
});
</script>

<template>
	<p class="muted">{{ t('auth.loggingIn') }}</p>
</template>
