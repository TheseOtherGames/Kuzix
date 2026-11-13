<script setup lang="ts">
import { computed } from 'vue';
import { avatarSvg } from '@/shared/avatars';

const props = defineProps<{ value: string }>();

// Markup only ever comes from our own part table; unknown values are rendered as plain text.
const markup = computed(() => avatarSvg(props.value));
</script>

<template>
	<svg v-if="markup" class="avatar-icon" viewBox="0 0 100 100" aria-hidden="true" v-html="markup"></svg>
	<template v-else>{{ value }}</template>
</template>

<style scoped>
.avatar-icon {
	display: inline-block;
	width: 1.3em;
	height: 1.3em;
	overflow: visible;
	vertical-align: middle;
}
</style>
