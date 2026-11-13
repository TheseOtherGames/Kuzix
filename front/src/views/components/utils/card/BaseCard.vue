<script setup lang="ts">
defineProps<{ accent?: string }>();
</script>

<template>
	<section class="card" :style="accent ? { borderTopColor: accent } : undefined">
		<slot />
	</section>
</template>

<style scoped>
.card {
	padding: 1.5rem;
	border-top: 0.35rem solid transparent;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

@media (max-width: 480px) {
	.card {
		padding: 1rem;
	}
}
</style>
