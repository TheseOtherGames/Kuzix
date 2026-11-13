<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

withDefaults(defineProps<{ icon?: string }>(), { icon: 'warning' });
</script>

<template>
	<p class="notice"><AppIcon :name="icon" /> <slot /></p>
</template>

<style scoped>
.notice {
	padding: 0.6rem 0.8rem;
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--color-3) 20%, transparent);
	font-size: 0.9rem;
}
</style>
