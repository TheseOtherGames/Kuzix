<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import { auth } from '@/utils/Auth';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';

// Copy of the free plan (server/src/features/user/plans.ts) and the quiz rules (quiz.service.ts, schema.sql).
// The page is public, so no user limits to read; serve them from an endpoint if plans start changing often.
const LIMITS = {
	quizzes: 10, questions: 20, minAnswers: 2, maxAnswers: 6, minTime: 5, maxTime: 120,
};

// Teaser cards for the paid plans in the works: blurred filler (aria-hidden), only the "coming soon" tag is real.
const TEASERS = [
	{ id: 'a', accent: 'var(--color-2)', lines: [14, 18, 12, 16, 10] },
	{ id: 'b', accent: 'var(--color-3)', lines: [16, 12, 18, 14, 11] },
];
</script>

<template>
	<div class="plans">
		<BaseCard class="plan" accent="var(--accent)">
			<h3>{{ t('home.plan.name') }}</h3>
			<p class="price">{{ t('home.plan.price') }} <span class="muted">{{ t('home.plan.period') }}</span></p>
			<ul>
				<li v-for="n in 7" :key="n"><AppIcon name="check" /> {{ t(`home.plan.${n}` as MessageKey, LIMITS) }}</li>
			</ul>
			<BaseButton :to="auth.user ? '/quizzes/new' : '/register'" size="lg" block>
				{{ auth.user ? t('home.newQuiz') : t('home.plan.cta') }}
			</BaseButton>
		</BaseCard>
		<BaseCard v-for="teaser in TEASERS" :key="teaser.id" class="plan teaser" :accent="teaser.accent">
			<span class="soon">{{ t('home.plan.soon') }}</span>
			<div class="blurred" aria-hidden="true">
				<h3>Lorem ipsum</h3>
				<p class="price">00 € <span class="muted">/ lorem</span></p>
				<ul>
					<li v-for="(width, lineIndex) in teaser.lines" :key="lineIndex"><AppIcon name="check" /> {{ 'Lorem ipsum dolor sit amet'.slice(0, width) }}</li>
				</ul>
				<span class="fake-button" />
			</div>
		</BaseCard>
	</div>
	<p class="contact muted">
		{{ t('home.contact') }}
		<RouterLink to="/legal">{{ t('home.contactLink') }}</RouterLink>
	</p>
</template>

<style scoped>
.plans {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
	gap: 1.5rem;
	align-items: stretch;
}

.plan {
	text-align: center;
}

.teaser {
	position: relative;
	overflow: hidden;
}

.blurred {
	filter: blur(6px);
	opacity: 0.7;
	user-select: none;
	pointer-events: none;
}

.soon {
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 1;
	padding: 0.4em 1em;
	border-radius: 999px;
	background: var(--accent);
	color: var(--on-accent);
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	white-space: nowrap;
	transform: translate(-50%, -50%) rotate(-6deg);
	box-shadow: var(--shadow);
}

.fake-button {
	display: block;
	height: 3rem;
	border-radius: var(--radius);
	background: var(--surface-2);
}

h3 {
	margin: 0;
	color: var(--accent-text);
	font-size: 1.1rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}

.price {
	margin: 0.3rem 0 1rem;
	font-size: 2.6rem;
	font-weight: 700;
}

.price span {
	font-size: 1rem;
	font-weight: 400;
}

ul {
	display: grid;
	gap: 0.6rem;
	margin: 0 0 1.5rem;
	padding: 0;
	list-style: none;
	text-align: left;
}

li {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
}

li :deep(svg) {
	flex: none;
	margin-top: 0.1rem;
}

.contact {
	max-width: 36rem;
	margin: 1.25rem auto 0;
	font-size: 0.9rem;
	text-align: center;
}
</style>
