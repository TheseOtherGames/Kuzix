<script setup lang="ts">
import { t } from '@/i18n';
import ProgressBar from '@/views/components/utils/progress/ProgressBar.vue';

defineProps<{ answered: number; total: number }>();
</script>

<template>
	<div class="progress">
		<p class="count"><strong>{{ answered }}</strong> / {{ total }}</p>
		<p class="muted">{{ t('host.answeredLabel') }}</p>
		<ProgressBar class="track" :ratio="answered / Math.max(1, total)" />
	</div>
</template>

<style scoped>
.progress {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: min(100%, 28rem);
	text-align: center;
}

.progress p {
	margin: 0;
}

.count {
	color: var(--text-muted);
	font-size: clamp(1.6rem, 3vw, 2.6rem);
	font-weight: 600;
}

.count strong {
	color: var(--text);
	font-size: clamp(3.5rem, 9vw, 7.5rem);
	line-height: 1;
}

.muted {
	font-size: clamp(1rem, 1.8vw, 1.4rem);
}

.track {
	width: 100%;
	height: 0.6rem;
	margin-top: 1rem;
}
</style>
