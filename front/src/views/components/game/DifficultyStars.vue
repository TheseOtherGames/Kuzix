<script setup lang="ts">
defineProps<{ difficulty: number }>();
</script>

<template>
	<span class="stars" aria-hidden="true"><span v-for="star in 5" :key="star" :class="{ on: star <= difficulty }">★</span></span>
</template>

<style scoped>
.stars {
	color: color-mix(in srgb, var(--text-muted) 35%, transparent);
	letter-spacing: 0.1em;
}

.on {
	color: var(--color-3);
	text-shadow: 0 0.08em 0 color-mix(in srgb, var(--color-3) 55%, black);
}
</style>
