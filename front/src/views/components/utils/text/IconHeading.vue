<script setup lang="ts">
// Tinted round icon beside a title and a muted line. `id` lets a radiogroup point at the title.
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

withDefaults(defineProps<{
	icon: string;
	title: string;
	text: string;
	tint?: string;
	id?: string;
	level?: 'h2' | 'h3';
}>(), { tint: 'var(--color-5)', level: 'h3' });
</script>

<template>
	<header class="icon-heading">
		<span class="icon" :style="{ '--tint': tint }"><AppIcon :name="icon" /></span>
		<span>
			<component :is="level" :id="id" class="title">{{ title }}</component>
			<p class="muted">{{ text }}</p>
		</span>
	</header>
</template>

<style scoped>
.icon-heading {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 0.9rem;
}

.title {
	margin: 0;
	font-size: 1.15rem;
}

.icon-heading p {
	margin: 0.15rem 0 0;
	font-size: 0.9rem;
	line-height: 1.35;
}

.icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 25%, var(--surface-2));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tint) 55%, transparent);
	font-size: 1.2rem;
}
</style>
