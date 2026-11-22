<script setup lang="ts">
import { t } from '@/i18n';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import CodeInput from '@/views/components/home/CodeInput.vue';
import HeroShapes from '@/views/components/home/HeroShapes.vue';
import HomeFaq from '@/views/components/home/HomeFaq.vue';
import HomeFeatures from '@/views/components/home/HomeFeatures.vue';
import HomePricing from '@/views/components/home/HomePricing.vue';
import HomeShowcase from '@/views/components/home/HomeShowcase.vue';
import HomeSteps from '@/views/components/home/HomeSteps.vue';
import { auth } from '@/utils/Auth';
import { api, ApiError } from '@/utils/API';
import { toast } from '@/utils/Toast';

const router = useRouter();
const CODE_LENGTH = 6;
const code = ref('');
const createLink = (): string => (auth.user ? '/quizzes/new' : '/register');

const FEATURES = [
	{ id: 'live', icon: 'signal', tint: 'var(--color-4)' },
	{ id: 'guest', icon: 'players', tint: 'var(--color-2)' },
	{ id: 'ai', icon: 'wand', tint: 'var(--color-5)' },
	{ id: 'library', icon: 'globe', tint: 'var(--color-2)' },
	{ id: 'stats', icon: 'chart', tint: 'var(--color-1)' },
	{ id: 'avatar', icon: 'palette', tint: 'var(--color-3)' },
	{ id: 'rules', icon: 'gear', tint: 'var(--color-6)' },
	{ id: 'anywhere', icon: 'monitor', tint: 'var(--color-4)' },
];
const USES = [{ id: 'class', icon: 'pencil', tint: 'var(--color-2)' }, { id: 'team', icon: 'players', tint: 'var(--color-4)' }, { id: 'party', icon: 'party', tint: 'var(--color-1)' }];

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
			<p class="or muted">{{ t('home.or') }}</p>
			<div class="ctas">
				<BaseButton :to="createLink()" variant="secondary">{{ t('home.newQuiz') }}</BaseButton>
				<BaseButton to="/library" variant="ghost">{{ t('home.library') }}</BaseButton>
			</div>
		</section>

		<section id="screenshots">
			<h2>{{ t('home.shotsTitle') }}</h2>
			<p class="lead muted">{{ t('home.shotsText') }}</p>
			<HomeShowcase />
		</section>

		<section id="how-it-works">
			<h2>{{ t('home.stepsTitle') }}</h2>
			<HomeSteps />
		</section>

		<section id="features">
			<h2>{{ t('home.featuresTitle') }}</h2>
			<HomeFeatures prefix="feature" :items="FEATURES" />
		</section>

		<section id="uses">
			<h2>{{ t('home.usesTitle') }}</h2>
			<HomeFeatures prefix="use" :items="USES" />
		</section>

		<section id="pricing">
			<h2>{{ t('home.pricingTitle') }}</h2>
			<p class="lead muted">{{ t('home.pricingText') }}</p>
			<HomePricing />
		</section>

		<section id="faq">
			<h2>{{ t('home.faqTitle') }}</h2>
			<HomeFaq />
		</section>

		<section class="cta">
			<h2>{{ t('home.ctaTitle') }}</h2>
			<p class="lead muted">{{ t('home.ctaText') }}</p>
			<div class="ctas">
				<BaseButton :to="createLink()" size="lg">{{ t('home.newQuiz') }}</BaseButton>
				<BaseButton to="/library" size="lg" variant="ghost">{{ t('home.library') }}</BaseButton>
			</div>
		</section>
	</div>
</template>

<style scoped>
.home {
	display: flex;
	flex-direction: column;
	gap: clamp(2rem, 5vw, 3rem);
	padding-bottom: 2rem;
}

/* Divider above every section but the hero: the four answer colours as dots on a fading line. */
.home > section + section::before {
	display: block;
	height: 0.8rem;
	margin: 0 auto clamp(2rem, 5vw, 3rem);
	background:
		radial-gradient(circle, var(--color-1) 0.3rem, transparent 0.32rem) calc(50% - 1.8rem) 50% / 0.8rem 0.8rem no-repeat,
		radial-gradient(circle, var(--color-2) 0.3rem, transparent 0.32rem) calc(50% - 0.6rem) 50% / 0.8rem 0.8rem no-repeat,
		radial-gradient(circle, var(--color-3) 0.3rem, transparent 0.32rem) calc(50% + 0.6rem) 50% / 0.8rem 0.8rem no-repeat,
		radial-gradient(circle, var(--color-4) 0.3rem, transparent 0.32rem) calc(50% + 1.8rem) 50% / 0.8rem 0.8rem no-repeat,
		linear-gradient(90deg, transparent, var(--border) 15% calc(50% - 3rem), transparent calc(50% - 3rem) calc(50% + 3rem), var(--border) calc(50% + 3rem) 85%, transparent) center / 100% 2px no-repeat;
	content: '';
}

.hero,
.cta {
	text-align: center;
}

.hero {
	padding-top: clamp(1rem, 6vw, 4rem);
}

h2 {
	margin: 0 0 1.5rem;
	font-size: clamp(1.5rem, 4vw, 2rem);
	text-align: center;
}

h2:has(+ .lead) {
	margin-bottom: 0.4rem;
}

.lead {
	max-width: 36rem;
	margin: 0 auto 1.5rem;
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

.or {
	margin: 1.25rem 0 0.75rem;
	font-size: 0.9rem;
}

.ctas {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.75rem;
}
</style>
