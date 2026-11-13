<script setup lang="ts">
import { t } from '@/i18n';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import CodeInput from '@/views/components/home/CodeInput.vue';
import HeroShapes from '@/views/components/home/HeroShapes.vue';
import HomeCards from '@/views/components/home/HomeCards.vue';
import { api, ApiError } from '@/utils/API';
import { toast } from '@/utils/Toast';

const router = useRouter();
const CODE_LENGTH = 6;
const code = ref('');

const join = async (): Promise<void> => {
	if (code.value.length !== CODE_LENGTH) {
		return;
	}
	try {
		await api(`/games/${code.value}`);
	} catch (error) {
		// Only a 404 stops here, other failures let the play page report the real error.
		if (error instanceof ApiError && error.status === 404) {
			toast.error(t('play.unknownCode'));

			return;
		}
	}
	router.push(`/play/${code.value}`);
};
</script>

<template>
	<div class="home">
		<section class="hero">
			<HeroShapes />
			<h1>{{ t('home.title') }}</h1>
			<p class="muted">{{ t('home.subtitle') }}</p>
			<form class="join" @submit.prevent="join">
				<CodeInput v-model="code" :length="CODE_LENGTH" />
				<BaseButton type="submit" size="lg" variant="success" :disabled="code.length !== CODE_LENGTH" :data-tip="code.length !== CODE_LENGTH ? t('home.playDisabled', { count: CODE_LENGTH }) : undefined">{{ t('home.play') }}</BaseButton>
			</form>
		</section>

		<HomeCards />
	</div>
</template>

<style scoped>
.home {
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
}

.hero {
	padding-top: clamp(1rem, 6vw, 4rem);
	text-align: center;
}

.join {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.75rem;
	max-width: 28rem;
	margin: 1.5rem auto 0;
}
</style>
