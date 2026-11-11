<script lang="ts">
// System icons: one file per icon in shared/icons/<name>.svg (see the system-icons skill).
const files = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true });
const ICONS: Record<string, string> = {};
for (const [path, source] of Object.entries(files)) {
	const root = source.match(/<svg[^>]*>/)![0];
	ICONS[path.match(/([^/]+)\.svg$/)![1]] = source.slice(source.indexOf(root) + root.length, source.lastIndexOf('</svg>'));
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ name: string }>();

// Markup only ever comes from our own icon files, never from user data.
const markup = computed(() => {
	if (import.meta.env.DEV && !ICONS[props.name]) {
		console.warn(`AppIcon: no icon named "${props.name}"`);
	}
	return ICONS[props.name] ?? '';
});
</script>

<template>
	<svg class="app-icon" viewBox="0 0 100 100" aria-hidden="true" v-html="markup"></svg>
</template>

<style scoped>
.app-icon {
	display: inline-block;
	flex-shrink: 0;
	width: 1.2em;
	height: 1.2em;
	overflow: visible;
	vertical-align: -0.22em;
}
</style>
