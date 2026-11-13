<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import type { PlayerPublic } from '@/interfaces/Game/GameInterface';
import { t } from '@/i18n';

const props = defineProps<{ players: PlayerPublic[] }>();

const MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'];

// Columns in display order (2nd, 1st, 3rd); `step` is the place, which also sets the reveal order (3rd first).
// All three steps always show; a step without a player stays empty.
const spots = computed(() => [1, 0, 2]
	.map((rankIndex): { player?: PlayerPublic; step: number } => ({ player: props.players[rankIndex], step: rankIndex + 1 })));
</script>

<template>
	<ol class="podium" :aria-label="t('host.podium')">
		<li v-for="spot in spots" :key="spot.step" class="spot" :class="`place-${spot.step}`">
			<div v-if="spot.player" class="winner">
				<span class="winner-avatar" aria-hidden="true"><AvatarIcon :value="spot.player.avatar" /></span>
				<NameTag :name="spot.player.nickname" :look="spot.player.avatar" />
				<strong class="winner-score">{{ t('play.points', { n: spot.player.score }) }}</strong>
			</div>
			<div class="step"><span><AppIcon v-if="(spot.player?.rank ?? spot.step) <= 3" :name="MEDALS[(spot.player?.rank ?? spot.step) - 1]" /><template v-else>{{ spot.player?.rank }}</template></span></div>
		</li>
	</ol>
</template>

<style scoped>
/* Steps rise 3rd → 2nd → 1st, each player pops in once their step is up. */
.podium {
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: clamp(0.5rem, 2vw, 1.5rem);
	width: min(100%, 52rem);
	margin: 0;
	padding: 0;
	list-style: none;
}

.spot {
	--delay: 0.4s;
	--height: 7rem;
	--color: var(--color-6);
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	min-width: 0;
}

.place-2 {
	--delay: 1.9s;
	--height: 10rem;
	--color: var(--color-2);
}

.place-1 {
	--delay: 3.4s;
	--height: 13rem;
	--color: var(--color-3);
}

.winner {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.4rem;
	max-width: 100%;
	margin-bottom: 0.75rem;
	font-size: clamp(1rem, 1.8vw, 1.5rem);
	animation: pop-in 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) calc(var(--delay) + 0.6s) backwards;
}

.winner-avatar {
	font-size: clamp(3rem, 7vw, 5.5rem);
	line-height: 1;
}

.place-1 .winner-avatar {
	animation: bounce 1.2s ease-in-out calc(var(--delay) + 1.2s) infinite;
}

.winner-score {
	font-variant-numeric: tabular-nums;
}

.step {
	display: grid;
	place-items: start center;
	width: 100%;
	height: min(var(--height), 22dvh);
	padding-top: 0.75rem;
	border-radius: var(--radius) var(--radius) 0 0;
	background: var(--color);
	box-shadow: inset 0 -0.4rem 0 color-mix(in srgb, var(--color) 60%, black);
	font-size: clamp(2rem, 4vw, 3.5rem);
	transform-origin: bottom;
	animation: rise 0.6s ease-out var(--delay) backwards;
}

@keyframes rise {
	from {
		transform: scaleY(0);
	}
}

@keyframes pop-in {
	from {
		opacity: 0;
		transform: translateY(1.5rem) scale(0.6);
	}
}

@keyframes bounce {
	50% {
		transform: translateY(-0.4rem);
	}
}
</style>
