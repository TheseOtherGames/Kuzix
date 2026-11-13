<script setup lang="ts">
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import PlayerChip from '@/views/components/game/PlayerChip.vue';
import type { PlayerPublic } from '@/interfaces/Game/GameInterface';
import { t } from '@/i18n';

defineProps<{ open: boolean; players: PlayerPublic[] }>();
const emit = defineEmits<{ close: []; kick: [player: PlayerPublic] }>();
</script>

<template>
	<BaseModal :open="open" :title="t('host.players')" @close="emit('close')">
		<p class="muted hint">{{ t('host.playersHint') }}</p>
		<div class="players">
			<PlayerChip
				v-for="player in players"
				:key="player.id"
				:avatar="player.avatar"
				:nickname="player.nickname"
				:dimmed="!player.connected"
				removable
				@remove="emit('kick', player)"
			/>
		</div>
		<template #actions>
			<BaseButton @click="emit('close')">{{ t('common.close') }}</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.hint {
	margin: 0 0 0.75rem;
}

.players {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* Inside the popup the remove button is always visible: that's what the popup is for. */
.players :deep(.remove) {
	opacity: 1;
}
</style>
