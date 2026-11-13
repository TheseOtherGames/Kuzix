<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import { ANSWER_ICONS } from '@/utils/Answers';
</script>

<template>
	<div class="shapes" aria-hidden="true">
		<span v-for="(icon, iconIndex) in ANSWER_ICONS.slice(0, 4)" :key="iconIndex" :style="{ animationDelay: `${iconIndex * 0.2}s` }"><AppIcon :name="icon" /></span>
	</div>
</template>

<style scoped>
.shapes {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 1rem;
	font-size: clamp(2rem, 6vw, 3rem);
}

.shapes span {
	animation: float 2.4s ease-in-out infinite;
}

@keyframes float {
	50% {
		transform: translateY(-0.6rem) rotate(8deg);
	}
}
</style>
