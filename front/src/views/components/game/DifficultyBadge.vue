<script setup lang="ts">
import DifficultyStars from '@/views/components/game/DifficultyStars.vue';
import type { MessageKey } from '@/locales/en';
import { POINTS_PER_DIFFICULTY } from '@/utils/Answers';
import { t } from '@/i18n';

defineProps<{ difficulty: number }>();
</script>

<template>
	<p class="difficulty" :title="t('q.difficulty')">
		<DifficultyStars class="stars" :difficulty="difficulty" />
		<span>{{ t(`q.level.${difficulty}` as MessageKey) }} · {{ difficulty * POINTS_PER_DIFFICULTY }} pts</span>
	</p>
</template>

<style scoped>
.difficulty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.15rem;
	margin: 0;
	padding: 0.35em 0.9em;
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow);
	font-size: clamp(0.85rem, 1.4vw, 1.15rem);
	font-weight: 600;
	white-space: nowrap;
}

.stars {
	font-size: 1.2em;
	line-height: 1;
}
</style>
