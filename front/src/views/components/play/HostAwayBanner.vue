<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import { t } from '@/i18n';

defineProps<{ show: boolean }>();
</script>

<template>
	<Transition name="banner">
		<div v-if="show" class="banner" role="status">
			<span class="banner-icon"><AppIcon name="signal" /></span>
			<span class="banner-text">
				<strong>{{ t('play.hostAwayTitle') }}</strong>
				<span class="muted">{{ t('play.waitingHost') }}</span>
			</span>
		</div>
	</Transition>
</template>

<style scoped>
/* Floats under the bar so the screen below doesn't jump when the host drops and comes back. */
.banner {
	position: fixed;
	top: calc(var(--header-height) + 0.4rem);
	left: 50%;
	z-index: 40;
	display: flex;
	align-items: center;
	gap: 0.8rem;
	width: min(calc(100% - 2rem), 26rem);
	padding: 0.7rem 1rem;
	border: 1px solid var(--border);
	border-left: 0.35rem solid var(--color-6);
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	transform: translateX(-50%);
}

.banner-icon {
	position: relative;
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-6) 18%, var(--surface));
	font-size: 1.2rem;
}

.banner-icon::after {
	content: '';
	position: absolute;
	inset: 0;
	border: 2px solid var(--color-6);
	border-radius: 50%;
	animation: ping 1.6s ease-out infinite;
}

.banner-text {
	display: flex;
	flex-direction: column;
	line-height: 1.3;
}

.banner-text .muted {
	font-size: 0.9rem;
}

@keyframes ping {
	to {
		opacity: 0;
		transform: scale(1.6);
	}
}

.banner-enter-active,
.banner-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.banner-enter-from,
.banner-leave-to {
	opacity: 0;
	transform: translate(-50%, -0.75rem);
}
</style>
