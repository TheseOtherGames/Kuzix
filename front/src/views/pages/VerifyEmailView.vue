<script setup lang="ts">
import { t } from '@/i18n';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/utils/API';
import { toast } from '@/utils/Toast';

const router = useRouter();

// Link from the confirmation email: the token rides in the hash so it never reaches server logs.
onMounted(async () => {
	const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
	try {
		await api('/auth/verify', 'POST', { token });
		toast.success(t('auth.emailConfirmed'));
	} catch (error) {
		toast.error((error as Error).message);
	}
	router.replace('/login');
});
</script>

<template>
	<p class="muted">{{ t('auth.confirming') }}</p>
</template>
