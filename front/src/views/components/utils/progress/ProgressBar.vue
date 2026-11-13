<script setup lang="ts">
// Rounded track + fill; `ratio` is 0..1. Size it from the parent (height, width, margin).
withDefaults(defineProps<{ ratio: number; color?: string }>(), { color: 'var(--accent)' });
</script>

<template>
	<span class="track" aria-hidden="true"><span class="fill" :style="{ width: `${Math.min(1, Math.max(0, ratio)) * 100}%`, background: color }"></span></span>
</template>

<style scoped>
.track {
	display: block;
	height: 0.35rem;
	overflow: hidden;
	border-radius: 999px;
	background: var(--surface-2);
}

.fill {
	display: block;
	height: 100%;
	border-radius: inherit;
	transition: width 0.4s ease;
}
</style>
