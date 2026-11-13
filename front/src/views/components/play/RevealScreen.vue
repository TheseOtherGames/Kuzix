<script setup lang="ts">
import MessageScreen from '@/views/components/game/MessageScreen.vue';
import AheadLine from '@/views/components/play/AheadLine.vue';
import type { PlayerState } from '@/interfaces/Game/GameInterface';
import { t } from '@/i18n';

defineProps<{ state: PlayerState }>();
</script>

<template>
	<MessageScreen v-if="state.question?.cancelled" icon="ban" :title="t('play.cancelledTitle')" :text="t('play.cancelledText')" />
	<MessageScreen
		v-else-if="state.result"
		:icon="state.result.correct ? 'party' : 'dizzy'"
		:title="state.result.correct ? t('play.correct') : state.myAnswer === null ? t('play.tooSlow') : t('play.oops')"
	>
		<p class="points" :class="{ good: state.result.correct }">+{{ state.result.points }}</p>
		<p class="muted">{{ t('play.rankLine', { rank: state.me.rank ?? '–', score: state.me.score ?? 0 }) }}</p>
		<AheadLine :ahead="state.ahead" :rank="state.me.rank" />
	</MessageScreen>
	<MessageScreen v-else icon="lock" :title="state.myAnswer === null ? t('play.timeUp') : t('play.locked')" :text="t('play.resultsAtEnd')" />
</template>
