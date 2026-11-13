<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import Leaderboard from '@/views/components/game/Leaderboard.vue';
import Podium from '@/views/components/host/Podium.vue';
import type { PlayerPublic } from '@/interfaces/Game/GameInterface';
import { t } from '@/i18n';

defineProps<{ players: PlayerPublic[] }>();

const fullRanking = ref(false);
</script>

<template>
	<section class="end">
		<h1 class="end-title"><AppIcon name="trophy" /> {{ t('host.ranking') }}</h1>
		<Leaderboard v-if="fullRanking" :entries="players" />
		<template v-else>
			<Podium :players="players" />
			<Leaderboard v-if="players.length > 3" class="rest" :entries="players.slice(3)" />
		</template>
		<div class="end-actions">
			<BaseButton variant="ghost" size="lg" @click="fullRanking = !fullRanking"><AppIcon :name="fullRanking ? 'trophy' : 'players'" /> {{ fullRanking ? t('host.showPodium') : t('host.showFullRanking') }}</BaseButton>
			<BaseButton to="/dashboard" size="lg">{{ t('host.backDashboard') }}</BaseButton>
		</div>
	</section>
</template>

<style scoped>
.end {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	min-height: 0;
	padding: clamp(1rem, 3vw, 2rem);
	overflow-y: auto;
	text-align: center;
}

.end-title {
	margin: 0;
	font-size: clamp(2rem, 5vw, 4rem);
}

.end > :deep(ol.leaderboard) {
	width: min(100%, 44rem);
	font-size: clamp(1rem, 1.8vw, 1.4rem);
}

.end-actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.75rem;
}

/* The rest of the ranking fades in after the podium. */
.rest {
	animation: fade-in 0.6s ease-out 4.8s backwards;
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
}
</style>
