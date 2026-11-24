<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import Notice from '@/views/components/utils/text/Notice.vue';

// Shown instead of the sign-up form once the server has emailed the confirmation link.
defineProps<{ email: string }>();
defineEmits<{ back: [] }>();

const STEPS: { key: MessageKey; tint: string }[] = [{ key: 'auth.sent.step1', tint: 'var(--color-2)' }, { key: 'auth.sent.step2', tint: 'var(--color-4)' }, { key: 'auth.sent.step3', tint: 'var(--color-6)' }];
</script>

<template>
	<section class="sent" aria-live="polite">
		<div class="hero" aria-hidden="true">
			<span class="bubble"><AppIcon name="mail" /></span>
			<AppIcon name="sparkles" class="spark one" />
			<AppIcon name="sparkles" class="spark two" />
		</div>
		<h1>{{ t('auth.sent.title') }}</h1>
		<p class="muted lead">{{ t('auth.sent.text') }}</p>
		<p class="email selectable">{{ email }}</p>

		<ol class="steps">
			<li v-for="(step, stepIndex) in STEPS" :key="step.key" :style="{ '--tint': step.tint }">
				<span class="number">{{ stepIndex + 1 }}</span>
				{{ t(step.key) }}
			</li>
		</ol>

		<Notice icon="info">{{ t('auth.sent.hint') }}</Notice>

		<div class="actions">
			<BaseButton to="/login" block size="lg">{{ t('auth.sent.login') }}</BaseButton>
			<BaseButton variant="ghost" block @click="$emit('back')">{{ t('auth.sent.change') }}</BaseButton>
		</div>
	</section>
</template>

<style scoped>
.sent {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.hero {
	position: relative;
	margin: 0.5rem 0 1rem;
}

.bubble {
	display: grid;
	place-items: center;
	width: 6rem;
	height: 6rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-2) 22%, var(--surface-2));
	box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--color-2) 55%, transparent), 0 0.3rem 0 color-mix(in srgb, var(--color-2) 55%, black);
	font-size: 3.2rem;
	animation: pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}

.bubble :deep(.app-icon) {
	animation: bob 2.4s ease-in-out 0.5s infinite;
}

.spark {
	position: absolute;
	font-size: 1.3rem;
	animation: twinkle 1.8s ease-in-out infinite;
}

.spark.one {
	top: -0.2rem;
	right: -0.6rem;
}

.spark.two {
	bottom: 0.4rem;
	left: -0.8rem;
	font-size: 0.95rem;
	animation-delay: 0.9s;
}

h1 {
	margin: 0;
	text-wrap: balance;
}

.lead {
	margin: 0.4rem 0 0.5rem;
	text-wrap: balance;
}

.email {
	max-width: 100%;
	margin: 0 0 1.25rem;
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--accent) 18%, var(--surface-2));
	box-shadow: inset 0 0 0 2px var(--accent-line);
	color: var(--text);
	font-weight: 600;
	overflow-wrap: anywhere;
}

.steps {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	margin: 0 0 1rem;
	padding: 0;
	list-style: none;
	text-align: left;
}

.steps li {
	display: flex;
	align-items: center;
	gap: 0.7rem;
	padding: 0.55rem 0.75rem;
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--tint) 15%, var(--surface));
	animation: pop 0.4s cubic-bezier(0.3, 1.6, 0.5, 1) backwards;
}

.steps li:nth-child(2) {
	animation-delay: 0.1s;
}

.steps li:nth-child(3) {
	animation-delay: 0.2s;
}

.number {
	display: grid;
	flex: none;
	place-items: center;
	width: 1.8rem;
	height: 1.8rem;
	border-radius: 50%;
	background: var(--tint);
	box-shadow: 0 0.15rem 0 color-mix(in srgb, var(--tint) 55%, black);
	color: #1e2230;
	font-weight: 700;
}

.sent :deep(.notice) {
	width: 100%;
	margin: 0;
	text-align: left;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	width: 100%;
	margin-top: 1.25rem;
}

@keyframes pop {
	from {
		opacity: 0;
		transform: scale(0.6);
	}
}

@keyframes bob {
	50% { transform: translateY(-0.2rem) rotate(-4deg); }
}

@keyframes twinkle {
	50% {
		opacity: 0.4;
		transform: scale(0.75) rotate(20deg);
	}
}
</style>
