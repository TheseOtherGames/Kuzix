<script setup lang="ts">
import IconHeading from '@/views/components/utils/text/IconHeading.vue';

defineProps<{
	icon: string;
	title: string;
	text: string;
}>();
</script>

<template>
	<section class="import-block">
		<IconHeading :icon="icon" :title="title" :text="text" />
		<slot />
	</section>
</template>

<style scoped>
.import-block {
	padding: 1rem;
	border: 2px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface-2);
}

.import-block + .import-block {
	margin-top: 1rem;
}
</style>
