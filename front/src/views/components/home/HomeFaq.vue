<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
</script>

<template>
	<div class="faq">
		<details v-for="n in 4" :key="n">
			<summary>{{ t(`home.faq.${n}.q` as MessageKey) }}</summary>
			<p class="muted">{{ t(`home.faq.${n}.a` as MessageKey) }}</p>
		</details>
	</div>
</template>

<style scoped>
.faq {
	display: grid;
	gap: 0.75rem;
	max-width: 44rem;
	margin: 0 auto;
}

details {
	border: 2px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
}

details[open] {
	border-color: var(--accent-line);
}

summary {
	padding: 0.9rem 1.1rem;
	font-weight: 600;
	cursor: pointer;
}

summary:hover {
	color: var(--accent-text);
}

p {
	margin: 0;
	padding: 0 1.1rem 1rem;
	line-height: 1.45;
}
</style>
