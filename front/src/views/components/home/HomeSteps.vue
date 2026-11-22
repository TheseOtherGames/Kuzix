<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

const STEPS = [{ icon: 'pencil', color: 'var(--color-1)' }, { icon: 'link', color: 'var(--color-2)' }, { icon: 'play', color: 'var(--color-4)' }];
</script>

<template>
	<ol class="steps">
		<li v-for="(step, i) in STEPS" :key="i" :style="{ '--tint': step.color }">
			<span class="icon"><AppIcon :name="step.icon" /><b>{{ i + 1 }}</b></span>
			<h3>{{ t(`home.step.${i + 1}.title` as MessageKey) }}</h3>
			<p class="muted">{{ t(`home.step.${i + 1}.text` as MessageKey) }}</p>
		</li>
	</ol>
</template>

<style scoped>
.steps {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
	gap: 1.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
	text-align: center;
}

li {
	padding: 1.5rem;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--tint) 55%, black);
}

.icon {
	position: relative;
	display: inline-grid;
	place-items: center;
	width: 3.5rem;
	height: 3.5rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 25%, var(--surface-2));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tint) 55%, transparent);
	font-size: 1.6rem;
}

.icon b {
	position: absolute;
	top: -0.3rem;
	right: -0.3rem;
	display: grid;
	place-items: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-accent);
	font-size: 0.85rem;
}

h3 {
	margin: 0.75rem 0 0.4rem;
}

p {
	margin: 0;
	line-height: 1.45;
}
</style>
