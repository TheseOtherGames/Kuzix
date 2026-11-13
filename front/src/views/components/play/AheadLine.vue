<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import type { PlayerState } from '@/interfaces/Game/GameInterface';
import { t, tp } from '@/i18n';

defineProps<{ ahead: PlayerState['ahead']; rank: number | null }>();
</script>

<template>
	<p v-if="ahead" class="ahead">
		{{ t('play.aheadOf') }}
		<NameTag :name="ahead.nickname" :look="ahead.avatar" />
		<span class="muted">{{ tp('play.aheadGap', ahead.gap) }}</span>
	</p>
	<p v-else-if="rank === 1" class="ahead"><AppIcon name="crown" /> {{ t('play.leading') }}</p>
</template>

<style scoped>
.ahead {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	max-width: 100%;
	margin: 0;
	padding: 0.5rem 1rem;
	border-radius: 999px;
	background: var(--surface-2);
	font-weight: 600;
}
</style>
