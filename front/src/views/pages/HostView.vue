<script setup lang="ts">
import { t } from '@/i18n';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import GameBar from '@/views/components/game/GameBar.vue';
import MessageScreen from '@/views/components/game/MessageScreen.vue';
import CountdownScreen from '@/views/components/game/CountdownScreen.vue';
import HostLobby from '@/views/components/host/HostLobby.vue';
import QuestionBoard from '@/views/components/host/QuestionBoard.vue';
import FinalRanking from '@/views/components/host/FinalRanking.vue';
import HostSettingsModal from '@/views/components/host/HostSettingsModal.vue';
import PlayersModal from '@/views/components/host/PlayersModal.vue';
import type { RevealMode } from '@/interfaces/Quiz/QuizInterface';
import type { HostState, PlayerPublic } from '@/interfaces/Game/GameInterface';
import { GameSocket } from '@/utils/GameSocket';
import { api } from '@/utils/API';
import { auth } from '@/utils/Auth';
import { toast } from '@/utils/Toast';

const route = useRoute();
const router = useRouter();
const state = ref<HostState | null>(null);
const settingsOpen = ref(false);
const stopOpen = ref(false);
const cancelOpen = ref(false);
const recodeOpen = ref(false);
const playersOpen = ref(false);
const kickTarget = ref<PlayerPublic | null>(null);
let pausedByPopup = false;

const socket = new GameSocket(
	() => ({ type: 'host', quizUid: String(route.params.id), token: auth.token ?? '' }),
	(message) => {
		if (message.type === 'host-state') {
			state.value = message.state;
		} else if (message.type === 'error') {
			toast.error(message.message);
			if (!state.value) {
				socket.close();
				router.replace('/dashboard');
			}
		} else if (message.type === 'closed') {
			toast.info(t('host.closed'));
			socket.close();
			router.replace('/');
		}
	},
);

onBeforeUnmount(() => socket.close());

const isLastQuestion = computed(() => state.value?.question?.index === (state.value?.questionsCount ?? 0) - 1);
const nextLabel = computed(() => (isLastQuestion.value ? t('host.final') : t('host.next')));

const next = (): void => socket.send({ type: 'next' });
const togglePause = (): void => socket.send({ type: 'pause', paused: !state.value?.paused });
const sendSettings = (settings: { revealMode: RevealMode; countdown: number }): void => socket.send({ type: 'settings', ...settings });

const askKick = (player: PlayerPublic): void => {
	playersOpen.value = false;
	kickTarget.value = player;
};

const kick = (): void => {
	socket.send({ type: 'kick', playerId: kickTarget.value!.id });
	kickTarget.value = null;
};

// Settings, players and the kick confirmation pause a running game while any of them is open,
// and resume it when the last one closes (only if they were what paused it).
const pausingPopupOpen = computed(() => settingsOpen.value || playersOpen.value || Boolean(kickTarget.value));
watch(pausingPopupOpen, (open) => {
	if (open && state.value?.phase !== 'lobby' && !state.value?.paused) {
		pausedByPopup = true;
		socket.send({ type: 'pause', paused: true });
	} else if (!open && pausedByPopup) {
		pausedByPopup = false;
		if (state.value?.paused) {
			socket.send({ type: 'pause', paused: false });
		}
	}
});

const cancelQuestion = (): void => {
	cancelOpen.value = false;
	socket.send({ type: 'cancel-question' });
};

// The server answers with `closed`, which sends us back to the dashboard.
const stop = (): void => {
	stopOpen.value = false;
	socket.send({ type: 'stop' });
};

// The server pushes the new code to this board through the game socket.
const regenerateCode = async (): Promise<void> => {
	recodeOpen.value = false;
	try {
		const { code } = await api<{ code: string }>(`/quizzes/${route.params.id}/code`, 'POST');
		toast.success(t('dash.newCodeDone', { code }));
	} catch (error) {
		toast.error((error as Error).message);
	}
};
</script>

<template>
	<div class="host">
		<GameBar :title="state?.title ?? ''" back-to="/dashboard" :back-label="t('host.back')" back-icon="back">
			<span v-if="state?.question || state?.countdown" class="chip accent">
				{{ (state.question ?? state.countdown)!.index + 1 }} / {{ state.questionsCount }}
			</span>
			<template v-if="state && state.phase !== 'end'">
				<button type="button" class="round" :data-tip="t('host.settings')" :aria-label="t('host.settings')" @click="settingsOpen = true"><AppIcon name="gear" /></button>
				<button
					v-if="state.phase !== 'lobby' || state.paused"
					type="button"
					class="round"
					:class="{ active: state.paused }"
					:data-tip="state.paused ? t('host.resume') : t('host.pause')"
					:aria-label="state.paused ? t('host.resume') : t('host.pause')"
					:aria-pressed="state.paused"
					@click="togglePause"
				>
					<AppIcon :name="state.paused ? 'play' : 'pause'" />
				</button>
				<button
					v-if="state.phase !== 'lobby'"
					type="button"
					class="round"
					:data-tip="t('host.players')"
					:aria-label="t('host.players')"
					@click="playersOpen = true"
				>
					<AppIcon name="players" />
				</button>
				<button type="button" class="round stop" :data-tip="t('host.stop')" :aria-label="t('host.stop')" @click="stopOpen = true"><AppIcon name="stop" /></button>
			</template>
		</GameBar>

		<p v-if="!state" class="center muted">{{ t('common.connecting') }}</p>

		<MessageScreen v-else-if="state.paused" icon="pause" :title="t('host.pausedTitle')" :text="t('host.pausedText')" badge projected>
			<BaseButton size="lg" variant="success" @click="togglePause"><AppIcon name="play" /> {{ t('host.resumeBtn') }}</BaseButton>
		</MessageScreen>

		<HostLobby
			v-else-if="state.phase === 'lobby'"
			:title="state.title"
			:code="state.code ?? ''"
			:players="state.players"
			@recode="recodeOpen = true"
			@kick="askKick"
			@start="next"
		/>

		<CountdownScreen
			v-else-if="state.phase === 'countdown' && state.countdown"
			:index="state.countdown.index"
			:total="state.questionsCount"
			:remaining-ms="state.countdown.remainingMs"
			:running="!state.paused"
			projected
		/>

		<QuestionBoard
			v-else-if="state.question && (state.phase === 'question' || state.phase === 'reveal')"
			:state="state"
			:question="state.question"
			:next-label="nextLabel"
			:is-last-question="isLastQuestion"
			@next="next"
			@cancel="cancelOpen = true"
		/>

		<FinalRanking v-else-if="state.phase === 'end'" :players="state.players" />

		<HostSettingsModal
			v-if="state"
			:open="settingsOpen"
			:reveal-mode="state.revealMode"
			:countdown="state.countdownSeconds"
			@close="settingsOpen = false"
			@change="sendSettings"
		/>
		<PlayersModal :open="playersOpen" :players="state?.players ?? []" @close="playersOpen = false" @kick="askKick" />

		<ConfirmModal :open="Boolean(kickTarget)" :title="t('host.kickTitle', { name: kickTarget?.nickname ?? '' })" :confirm-label="t('host.kickConfirm')" @close="kickTarget = null" @confirm="kick">
			<p>{{ t('host.kickText') }}</p>
		</ConfirmModal>

		<ConfirmModal :open="recodeOpen" :title="t('dash.newCodeTitle')" :confirm-label="t('dash.newCodeConfirm')" icon="refresh" @close="recodeOpen = false" @confirm="regenerateCode">
			<p>{{ t('dash.newCodeText', { code: state?.code ?? '' }) }}</p>
			<p class="muted">{{ t('dash.newCodeAuto') }}</p>
		</ConfirmModal>

		<ConfirmModal :open="cancelOpen" :title="t('host.cancelQTitle')" :confirm-label="t('host.cancelQConfirm')" @close="cancelOpen = false" @confirm="cancelQuestion">
			<p>{{ t('host.cancelQText') }}</p>
		</ConfirmModal>

		<ConfirmModal :open="stopOpen" :title="t('host.stopTitle')" :confirm-label="t('host.stopConfirm')" icon="stop" @close="stopOpen = false" @confirm="stop">
			<p>{{ t('host.stopText') }}</p>
		</ConfirmModal>
	</div>
</template>

<style scoped>
/* Built to be projected: one screen, no page scroll, type sized from the viewport. */
.host {
	display: flex;
	flex-direction: column;
	height: 100dvh;
	overflow: hidden;
}

.center {
	margin: auto;
}

.round.active {
	background: var(--accent);
	color: var(--on-accent);
}

.round.stop:hover {
	background: var(--btn-danger);
	color: var(--on-color);
}

/* Small screens (the host on a laptop or tablet): stack, allow scrolling. */
@media (max-width: 860px) {
	.host {
		height: auto;
		min-height: 100dvh;
		overflow: visible;
	}
}
</style>
