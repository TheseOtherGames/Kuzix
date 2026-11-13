<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import MessageScreen from '@/views/components/game/MessageScreen.vue';
import AheadLine from '@/views/components/play/AheadLine.vue';
import type { PlayerState } from '@/interfaces/Game/GameInterface';
import { auth } from '@/utils/Auth';
import { t } from '@/i18n';

defineProps<{ state: PlayerState }>();
const emit = defineEmits<{ saveScore: [path: '/login' | '/register'] }>();

const saveDismissed = ref(false);
</script>

<template>
	<MessageScreen
		:icon="state.me.rank === 1 ? 'trophy' : state.me.rank && state.me.rank <= 3 ? 'party' : 'star'"
		:title="t('play.rankOf', { rank: state.me.rank ?? '–', n: state.playersCount })"
	>
		<p class="points good">{{ t('play.points', { n: state.me.score ?? 0 }) }}</p>
		<AheadLine :ahead="state.ahead" :rank="state.me.rank" />

		<BaseCard v-if="!auth.user && !saveDismissed" accent="var(--color-2)" class="save">
			<h2>{{ t('play.saveTitle') }}</h2>
			<p class="muted">{{ t('play.saveText') }}</p>
			<div class="save-actions">
				<BaseButton variant="secondary" @click="emit('saveScore', '/register')">{{ t('play.createAccount') }}</BaseButton>
				<BaseButton variant="ghost" @click="emit('saveScore', '/login')">{{ t('common.logIn') }}</BaseButton>
				<BaseButton variant="ghost" @click="saveDismissed = true">{{ t('play.noThanks') }}</BaseButton>
			</div>
		</BaseCard>
		<p v-else-if="auth.user" class="muted"><AppIcon name="check" /> {{ t('play.saved') }}</p>
		<BaseButton to="/" variant="ghost">{{ t('common.backHome') }}</BaseButton>
	</MessageScreen>
</template>

<style scoped>
.save {
	width: min(100%, 28rem);
	margin: 1rem 0;
}

.save-actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5rem;
}
</style>
