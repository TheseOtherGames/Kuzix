<script setup lang="ts">
import { t } from '@/i18n';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GameBar from '@/views/components/game/GameBar.vue';
import CountdownScreen from '@/views/components/game/CountdownScreen.vue';
import HostAwayBanner from '@/views/components/play/HostAwayBanner.vue';
import JoinForm from '@/views/components/play/JoinForm.vue';
import PlayerLobby from '@/views/components/play/PlayerLobby.vue';
import AnswerPad from '@/views/components/play/AnswerPad.vue';
import MessageScreen from '@/views/components/game/MessageScreen.vue';
import RevealScreen from '@/views/components/play/RevealScreen.vue';
import EndScreen from '@/views/components/play/EndScreen.vue';
import type { ClientMessage, PlayerState } from '@/interfaces/Game/GameInterface';
import type { Profile } from '@/interfaces/User/UserInterface';
import { GameSocket } from '@/utils/GameSocket';
import { auth, currentProfile, guestProfile, setPendingClaim } from '@/utils/Auth';
import { toast } from '@/utils/Toast';
import { api, ApiError } from '@/utils/API';

const route = useRoute();
const router = useRouter();
const code = String(route.params.code).toLowerCase();
const tokenKey = `kuzix-player-${code}`;

const profile = ref<Profile>(currentProfile());
const state = ref<PlayerState | null>(null);
const joined = ref(false);
// Waiting-room look builder: `draft` is edited, `state.me` is what the others see.
const draft = ref<Profile>({ ...profile.value });
const savingLook = ref(false);
const justSaved = ref(false);
const lookDirty = computed(() => Boolean(state.value)
	&& (draft.value.nickname.trim() !== state.value!.me.nickname || draft.value.avatar !== state.value!.me.avatar));
let socket: GameSocket | null = null;
// True between sending join/rejoin and the first snapshot: an error then means we have no seat.
let greetingPending = false;

const greeting = (): ClientMessage => {
	greetingPending = true;
	const playerToken = sessionStorage.getItem(tokenKey);
	if (playerToken) {
		return { type: 'rejoin', playerToken };
	}

	return {
		type: 'join', code, nickname: profile.value.nickname, avatar: profile.value.avatar, token: auth.token ?? undefined,
	};
};

const leave = (): void => {
	socket?.close();
	socket = null;
	joined.value = false;
};

const connect = (): void => {
	joined.value = true;
	socket = new GameSocket(greeting, (message) => {
		if (message.type === 'player-state') {
			greetingPending = false;
			const keepDraft = lookDirty.value && !savingLook.value;
			state.value = message.state;
			savingLook.value = false;
			if (!keepDraft) {
				draft.value = { nickname: message.state.me.nickname, avatar: message.state.me.avatar };
			}
			profile.value = { nickname: message.state.me.nickname, avatar: message.state.me.avatar };
			sessionStorage.setItem(tokenKey, message.state.playerToken);
		} else if (message.type === 'error') {
			onError(message.message);
		} else if (message.type === 'kicked') {
			toast.info(t('play.kicked'));
			sessionStorage.removeItem(tokenKey);
			leave();
			router.replace('/');
		} else if (message.type === 'closed') {
			toast.info(t('play.hostClosed'));
			sessionStorage.removeItem(tokenKey);
			leave();
			router.replace('/');
		}
	});
};

const onError = (text: string): void => {
	if (!greetingPending) {
		// A refused action (e.g. profile change after the start): we keep our seat.
		savingLook.value = false;
		justSaved.value = false;
		toast.error(text);

		return;
	}
	const wasRejoin = sessionStorage.getItem(tokenKey) !== null;
	sessionStorage.removeItem(tokenKey);
	if (wasRejoin && state.value) {
		// Our seat is gone (server restarted, game reloaded): take a new one silently with the same profile.
		socket?.send(greeting());

		return;
	}
	toast.error(text);
	state.value = null;
	leave();
};

const saveLook = (): void => {
	savingLook.value = true;
	socket?.send({ type: 'profile', nickname: draft.value.nickname.trim(), avatar: draft.value.avatar });
	if (!auth.user) {
		Object.assign(guestProfile, draft.value);
	}
	justSaved.value = true;
	setTimeout(() => {
		justSaved.value = false;
	}, 2500);
};

const undoLook = (): void => {
	draft.value = { nickname: state.value!.me.nickname, avatar: state.value!.me.avatar };
};

const join = (): void => {
	if (!auth.user) {
		Object.assign(guestProfile, profile.value);
	}
	connect();
};

if (sessionStorage.getItem(tokenKey)) {
	connect();
} else {
	// Direct link with a wrong code: back home with a toast, like the home page join.
	api(`/games/${encodeURIComponent(code)}`).catch((error) => {
		if (error instanceof ApiError && error.status === 404) {
			toast.error(t('play.unknownCode'));
			router.replace('/');
		}
	});
}

onBeforeUnmount(leave);

const answer = (index: number): void => {
	socket?.send({ type: 'answer', index });
};

const saveScore = (path: '/login' | '/register'): void => {
	setPendingClaim(state.value!.playerToken);
	router.push({ path, query: { redirect: '/profile' } });
};

const phase = computed(() => state.value?.phase);
const answered = computed(() => state.value?.myAnswer !== null && state.value?.myAnswer !== undefined);
</script>

<template>
	<div class="play">
		<GameBar :title="state?.title ?? code" back-to="/" :back-label="t('play.leave')" back-icon="close">
			<span v-if="state?.question || state?.countdown" class="chip">{{ (state.question ?? state.countdown)!.index + 1 }}/{{ state.questionsCount }}</span>
			<span v-if="state?.me.score !== null && state?.me.score !== undefined" class="chip accent">{{ t('common.pts', { n: state.me.score }) }}</span>
		</GameBar>

		<HostAwayBanner :show="Boolean(state && !state.hostConnected && phase !== 'end')" />

		<JoinForm v-if="!state && !joined" v-model="profile.nickname" @submit="join" />

		<p v-else-if="!state" class="connecting muted">{{ t('common.connecting') }}</p>

		<MessageScreen v-else-if="state.paused && phase !== 'end'" icon="pause" :title="t('play.pausedTitle')" :text="t('play.pausedText')" badge />

		<PlayerLobby
			v-else-if="phase === 'lobby'"
			v-model="draft"
			:nickname="state.me.nickname"
			:players-count="state.playersCount"
			:under-banner="!state.hostConnected"
			:dirty="lookDirty"
			:saving="savingLook"
			:saved="justSaved"
			@save="saveLook"
			@undo="undoLook"
		/>

		<CountdownScreen
			v-else-if="phase === 'countdown' && state.countdown"
			:index="state.countdown.index"
			:total="state.questionsCount"
			:remaining-ms="state.countdown.remainingMs"
			:running="!state.paused"
		/>

		<AnswerPad
			v-else-if="phase === 'question' && state.question && !answered"
			:count="state.question.answersCount"
			:remaining-ms="state.question.remainingMs"
			:time-limit="state.question.timeLimit"
			@answer="answer"
		/>

		<MessageScreen v-else-if="phase === 'question'" icon="check" :title="t('play.locked')" :text="t('play.waitingOthers')" />

		<RevealScreen v-else-if="phase === 'reveal'" :state="state" />

		<EndScreen v-else-if="phase === 'end'" :state="state" @save-score="saveScore" />
	</div>
</template>

<style scoped>
.play {
	display: flex;
	flex-direction: column;
	min-height: 100dvh;
}

.connecting {
	margin: auto;
}
</style>
