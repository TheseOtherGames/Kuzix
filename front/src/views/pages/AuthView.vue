<script setup lang="ts">
import { t } from '@/i18n';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import NicknameInput from '@/views/components/utils/form/NicknameInput.vue';
import OAuthProviders from '@/views/components/auth/OAuthProviders.vue';
import ConfirmationSent from '@/views/components/auth/ConfirmationSent.vue';
import { loginWithPassword, register } from '@/utils/Auth';
import { toast } from '@/utils/Toast';

const route = useRoute();
const router = useRouter();
const isRegister = computed(() => route.meta.mode === 'register');
const form = reactive({ email: '', password: '', username: '' });
const loading = ref(false);
// Email a confirmation link went to; the card then shows ConfirmationSent instead of the form.
const confirmationSentTo = ref('');
watch(isRegister, () => {
	confirmationSentTo.value = '';
});
const redirect = computed(() => (typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'));

const submit = async (): Promise<void> => {
	loading.value = true;
	try {
		if (isRegister.value) {
			if (!(await register(form.email, form.password, form.username))) {
				confirmationSentTo.value = form.email;

				return;
			}
			toast.success(t('auth.welcome'));
		} else {
			await loginWithPassword(form.email, form.password);
			toast.success(t('auth.welcomeBack'));
		}
		router.push(redirect.value);
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<BaseCard class="auth" :accent="confirmationSentTo ? 'var(--color-2)' : 'var(--accent)'">
		<ConfirmationSent v-if="confirmationSentTo" :email="confirmationSentTo" @back="confirmationSentTo = ''" />
		<template v-else>
			<h1>{{ isRegister ? t('common.createAccount') : t('common.logIn') }}</h1>
			<form class="form" @submit.prevent="submit">
				<NicknameInput v-if="isRegister" v-model="form.username" :label="t('auth.username')" autocomplete="nickname" />
				<label>
					{{ t('auth.email') }}
					<input v-model="form.email" type="email" required autocomplete="email" />
				</label>
				<label>
					{{ t('auth.password') }}
					<input
						v-model="form.password"
						type="password"
						:minlength="isRegister ? 8 : undefined"
						required
						:autocomplete="isRegister ? 'new-password' : 'current-password'"
					/>
				</label>
				<BaseButton type="submit" block size="lg" :loading="loading">
					{{ isRegister ? t('auth.signUp') : t('common.logIn') }}
				</BaseButton>
			</form>

			<OAuthProviders />

			<p class="switch muted">
				<template v-if="isRegister">
					{{ t('auth.haveAccount') }} <RouterLink :to="{ path: '/login', query: route.query }">{{ t('common.logIn') }}</RouterLink>
				</template>
				<template v-else>
					{{ t('auth.newHere') }} <RouterLink :to="{ path: '/register', query: route.query }">{{ t('common.createAccount') }}</RouterLink>
				</template>
			</p>
		</template>
	</BaseCard>
</template>

<style scoped>
.auth {
	max-width: 26rem;
	margin: clamp(0rem, 4vw, 3rem) auto 0;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.divider {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 1.5rem 0 1rem;
	font-size: 0.9rem;
}

.divider::before,
.divider::after {
	content: '';
	flex: 1;
	border-top: 2px dashed var(--border);
}

.providers {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	gap: 0.75rem;
}

/* Brand colours are fixed by Google/GitHub guidelines, so they stay hex instead of palette tokens */
.providers .provider {
	padding-left: 0.4rem;
	justify-content: flex-start;
	gap: 0.6rem;
}

.providers .google {
	--btn-color: #d93025;
	--btn-on: #ffffff;
}

.providers .github {
	--btn-color: #24292f;
	--btn-on: #ffffff;
}

.providers .provider:hover {
	outline: 2px solid var(--accent-line);
	outline-offset: -2px;
}

.provider-icon {
	display: grid;
	place-items: center;
	width: 2.2rem;
	height: 2.2rem;
	flex: none;
	border-radius: 50%;
	background: #ffffff;
}

.provider-icon svg {
	width: 1.3rem;
	height: 1.3rem;
}

.provider:hover .provider-icon {
	animation: wiggle 0.4s;
}

@keyframes wiggle {
	30% { transform: rotate(-12deg) scale(1.1); }
	70% { transform: rotate(8deg) scale(1.1); }
}

.switch {
	margin: 1.5rem 0 0;
	text-align: center;
}
</style>
