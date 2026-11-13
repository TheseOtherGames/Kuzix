<script setup lang="ts">
import { t } from '../../shared/i18n/i18n';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import AppIcon from '../../shared/ui/AppIcon.vue';
import { ANSWER_COLORS, ANSWER_ICONS } from '../../shared/answers';
import { auth } from '../auth/auth.store';
import { api, ApiError } from '../../shared/api';
import { toast } from '../../shared/toast.store';

const router = useRouter();
const code = ref('');

const cleanCode = computed(() => code.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6));

const join = async (): Promise<void> => {
	if (cleanCode.value.length !== 6) {
		return;
	}
	try {
		await api(`/games/${cleanCode.value}`);
	} catch (error) {
		// ponytail: only a 404 stops here, other failures let the play page report the real error.
		if (error instanceof ApiError && error.status === 404) {
			toast.error(t('play.unknownCode'));
			return;
		}
	}
	router.push(`/play/${cleanCode.value}`);
};
</script>

<template>
	<div class="home">
		<section class="hero">
			<div class="shapes" aria-hidden="true">
				<span v-for="(icon, i) in ANSWER_ICONS.slice(0, 4)" :key="i" :style="{ animationDelay: `${i * 0.2}s` }"><AppIcon :name="icon" /></span>
			</div>
			<h1>{{ t('home.title') }}</h1>
			<p class="muted">{{ t('home.subtitle') }}</p>
			<form class="join" @submit.prevent="join">
				<input
					v-model="code"
					class="code"
					inputmode="text"
					autocomplete="off"
					autocapitalize="off"
					maxlength="6"
					placeholder="abc123"
					:aria-label="t('home.codeLabel')"
				/>
				<BaseButton type="submit" size="lg" variant="success" :disabled="cleanCode.length !== 6">{{ t('home.play') }}</BaseButton>
			</form>
		</section>

		<div class="cards">
			<BaseCard :accent="ANSWER_COLORS[1]">
				<h2>{{ t('home.createTitle') }}</h2>
				<p class="muted">{{ t('home.createText') }}</p>
				<BaseButton :to="auth.user ? '/quizzes/new' : '/register'" variant="secondary">
					{{ auth.user ? t('home.newQuiz') : t('common.createAccount') }}
				</BaseButton>
			</BaseCard>
			<BaseCard :accent="ANSWER_COLORS[2]">
				<h2>{{ t('home.trackTitle') }}</h2>
				<p class="muted">{{ t('home.trackText') }}</p>
				<BaseButton :to="auth.user ? '/profile' : '/login'" variant="ghost">
					{{ auth.user ? t('home.myProfile') : t('common.logIn') }}
				</BaseButton>
			</BaseCard>
		</div>
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

.shapes {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 1rem;
	font-size: clamp(2rem, 6vw, 3rem);
}

.shapes span {
	animation: float 2.4s ease-in-out infinite;
}

.join {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.75rem;
	max-width: 28rem;
	margin: 1.5rem auto 0;
}

.code {
	flex: 1 1 12rem;
	font-family: var(--font-mono);
	font-size: 1.6rem;
	font-weight: 700;
	letter-spacing: 0.25em;
	text-align: center;
	text-transform: lowercase;
}

.cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
	gap: 1.5rem;
}

@keyframes float {
	50% {
		transform: translateY(-0.6rem) rotate(8deg);
	}
}
</style>
