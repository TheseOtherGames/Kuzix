<script setup lang="ts">
// A grid of IconHeading tiles: features (`home.feature.<id>`) or use cases (`home.use.<id>`).
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import IconHeading from '@/views/components/utils/text/IconHeading.vue';

defineProps<{ prefix: 'feature' | 'use'; items: { id: string; icon: string; tint: string }[] }>();
</script>

<template>
	<ul class="grid" :class="prefix">
		<li v-for="item in items" :key="item.id">
			<IconHeading
				:icon="item.icon"
				:tint="item.tint"
				:title="t(`home.${prefix}.${item.id}.title` as MessageKey)"
				:text="t(`home.${prefix}.${item.id}.text` as MessageKey)"
			/>
		</li>
	</ul>
</template>

<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

li {
	padding: 1.1rem 1.1rem 0.2rem;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface);
	transition: transform 0.15s;
}

li:hover {
	transform: translateY(-0.2rem);
}

.use {
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
</style>
