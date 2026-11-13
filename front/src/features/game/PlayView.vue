<script setup lang="ts">
import { t, tp } from '../../shared/i18n/i18n';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AnswerGrid from './AnswerGrid.vue';
import CountdownNumber from './CountdownNumber.vue';
import AppIcon from '../../shared/ui/AppIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import GameBar from './GameBar.vue';
import NameTag from '../../shared/ui/NameTag.vue';
import ProfileForm from '../../shared/ui/ProfileForm.vue';
import SaveBar from '../../shared/ui/SaveBar.vue';
import TimerRing from './TimerRing.vue';
import type { ClientMessage, PlayerState } from './game.types';
import type { Profile } from '../auth/user.types';
import { GameSocket } from './game.socket';
import { auth, currentProfile, guestProfile, setPendingClaim } from '../auth/auth.store';
import { toast } from '../../shared/toast.store';
import { api, ApiError } from '../../shared/api';

const route = useRoute();
const router = useRouter();
const code = String(route.params.code).toLowerCase();
const tokenKey = `kuzix-player-${code}`;

const profile = ref<Profile>(currentProfile());
const state = ref<PlayerState | null>(null);
const saveDismissed = ref(false);
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
	return { type: 'join', code, nickname: profile.value.nickname, avatar: profile.value.avatar, token: auth.token ?? undefined };
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

		<Transition name="banner">
			<div v-if="state && !state.hostConnected && phase !== 'end'" class="banner" role="status">
				<span class="banner-icon"><AppIcon name="signal" /></span>
				<span class="banner-text">
					<strong>{{ t('play.hostAwayTitle') }}</strong>
					<span class="muted">{{ t('play.waitingHost') }}</span>
				</span>
			</div>
		</Transition>

		<form v-if="!state && !joined" class="screen" @submit.prevent="join">
			<BaseCard accent="var(--color-4)" class="join">
				<h1>{{ t('play.whoAreYou') }}</h1>
				<label>
					{{ t('pf.nickname') }}
					<span class="char-count">{{ profile.nickname.length }}/24</span>
					<input v-model="profile.nickname" maxlength="24" required autofocus :placeholder="t('pf.nicknamePh')" />
				</label>
				<p class="muted join-hint">{{ t('play.joinHint') }}</p>
				<BaseButton type="submit" size="lg" variant="success" block :disabled="!profile.nickname.trim()">{{ t('play.join') }}</BaseButton>
			</BaseCard>
		</form>

		<p v-else-if="!state" class="screen muted">{{ t('common.connecting') }}</p>

		<section v-else-if="state.paused && phase !== 'end'" class="screen message">
			<span class="pause-icon"><AppIcon name="pause" /></span>
			<h1>{{ t('play.pausedTitle') }}</h1>
			<p class="muted">{{ t('play.pausedText') }}</p>
		</section>

		<section v-else-if="phase === 'lobby'" class="lobby" :class="{ 'under-banner': !state.hostConnected }">
			<header class="lobby-head message">
				<h1>{{ t('play.youreIn', { name: state.me.nickname }) }}</h1>
				<p class="muted">{{ tp('play.lobby', state.playersCount) }}</p>
			</header>
			<BaseCard accent="var(--accent)" class="lobby-card">
				<h2 class="lobby-title">{{ t('play.lookTitle') }}</h2>
				<form class="lobby-form" @submit.prevent="saveLook">
					<ProfileForm v-model="draft" />
					<SaveBar :dirty="lookDirty" :saving="savingLook" :saved="justSaved" @undo="undoLook" />
				</form>
			</BaseCard>
		</section>

		<section v-else-if="phase === 'countdown' && state.countdown" class="screen message">
			<p class="muted">{{ t('host.questionOf', { n: state.countdown.index + 1, total: state.questionsCount }) }}</p>
			<CountdownNumber :remaining-ms="state.countdown.remainingMs" :running="!state.paused" />
			<h1>{{ t('host.getReady') }}</h1>
		</section>

		<section v-else-if="phase === 'question' && state.question && !answered" class="answering">
			<div class="timer-row">
				<TimerRing size="sm" :remaining-ms="state.question.remainingMs" :duration="state.question.timeLimit" running />
				<span class="muted">{{ t('play.pick') }}</span>
			</div>
			<AnswerGrid :count="state.question.answersCount" @select="answer" />
		</section>

		<section v-else-if="phase === 'question'" class="screen message">
			<span class="big-avatar"><AppIcon name="check" /></span>
			<h1>{{ t('play.locked') }}</h1>
			<p class="muted">{{ t('play.waitingOthers') }}</p>
		</section>

		<section v-else-if="phase === 'reveal'" class="screen message">
			<template v-if="state.question?.cancelled">
				<span class="big-avatar"><AppIcon name="ban" /></span>
				<h1>{{ t('play.cancelledTitle') }}</h1>
				<p class="muted">{{ t('play.cancelledText') }}</p>
			</template>
			<template v-else-if="state.result">
				<span class="big-avatar"><AppIcon :name="state.result.correct ? 'party' : 'dizzy'" /></span>
				<h1>{{ state.result.correct ? t('play.correct') : state.myAnswer === null ? t('play.tooSlow') : t('play.oops') }}</h1>
				<p class="points" :class="{ good: state.result.correct }">+{{ state.result.points }}</p>
				<p class="muted">{{ t('play.rankLine', { rank: state.me.rank ?? '–', score: state.me.score ?? 0 }) }}</p>
				<p v-if="state.ahead" class="ahead">
					{{ t('play.aheadOf') }}
					<NameTag :name="state.ahead.nickname" :look="state.ahead.avatar" />
					<span class="muted">{{ tp('play.aheadGap', state.ahead.gap) }}</span>
				</p>
				<p v-else-if="state.me.rank === 1" class="ahead"><AppIcon name="crown" /> {{ t('play.leading') }}</p>
			</template>
			<template v-else>
				<span class="big-avatar"><AppIcon name="lock" /></span>
				<h1>{{ state.myAnswer === null ? t('play.timeUp') : t('play.locked') }}</h1>
				<p class="muted">{{ t('play.resultsAtEnd') }}</p>
			</template>
		</section>

		<section v-else-if="phase === 'end'" class="screen message">
			<span class="big-avatar"><AppIcon :name="state.me.rank === 1 ? 'trophy' : state.me.rank && state.me.rank <= 3 ? 'party' : 'star'" /></span>
			<h1>{{ t('play.rankOf', { rank: state.me.rank ?? '–', n: state.playersCount }) }}</h1>
			<p class="points good">{{ t('play.points', { n: state.me.score ?? 0 }) }}</p>
			<p v-if="state.ahead" class="ahead">
				{{ t('play.aheadOf') }}
				<NameTag :name="state.ahead.nickname" :look="state.ahead.avatar" />
				<span class="muted">{{ tp('play.aheadGap', state.ahead.gap) }}</span>
			</p>
			<p v-else-if="state.me.rank === 1" class="ahead"><AppIcon name="crown" /> {{ t('play.leading') }}</p>

			<BaseCard v-if="!auth.user && !saveDismissed" accent="var(--color-2)" class="save">
				<h2>{{ t('play.saveTitle') }}</h2>
				<p class="muted">{{ t('play.saveText') }}</p>
				<div class="save-actions">
					<BaseButton variant="secondary" @click="saveScore('/register')">{{ t('play.createAccount') }}</BaseButton>
					<BaseButton variant="ghost" @click="saveScore('/login')">{{ t('common.logIn') }}</BaseButton>
					<BaseButton variant="ghost" @click="saveDismissed = true">{{ t('play.noThanks') }}</BaseButton>
				</div>
			</BaseCard>
			<p v-else-if="auth.user" class="muted"><AppIcon name="check" /> {{ t('play.saved') }}</p>
			<BaseButton to="/" variant="ghost">{{ t('common.backHome') }}</BaseButton>
		</section>

	</div>
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

.play {
	display: flex;
	flex-direction: column;
	min-height: 100dvh;
}







.pause-icon {
	display: grid;
	place-items: center;
	width: 6rem;
	aspect-ratio: 1;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--accent) 55%, black);
	color: var(--on-accent);
	font-size: 3rem;
	animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
	50% {
		transform: scale(1.06);
	}
}

/* Floats under the bar so the screen below doesn't jump when the host drops and comes back. */
.banner {
	position: fixed;
	top: calc(var(--header-height) + 0.4rem);
	left: 50%;
	z-index: 40;
	display: flex;
	align-items: center;
	gap: 0.8rem;
	width: min(calc(100% - 2rem), 26rem);
	padding: 0.7rem 1rem;
	border: 1px solid var(--border);
	border-left: 0.35rem solid var(--color-6);
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	transform: translateX(-50%);
}

.banner-icon {
	position: relative;
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--color-6) 18%, var(--surface));
	font-size: 1.2rem;
}

.banner-icon::after {
	content: '';
	position: absolute;
	inset: 0;
	border: 2px solid var(--color-6);
	border-radius: 50%;
	animation: ping 1.6s ease-out infinite;
}

.banner-text {
	display: flex;
	flex-direction: column;
	line-height: 1.3;
}

.banner-text .muted {
	font-size: 0.9rem;
}

@keyframes ping {
	to {
		opacity: 0;
		transform: scale(1.6);
	}
}

.banner-enter-active,
.banner-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.banner-enter-from,
.banner-leave-to {
	opacity: 0;
	transform: translate(-50%, -0.75rem);
}

.screen {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1.5rem 1rem;
}

.message {
	text-align: center;
	animation: pop 0.35s ease-out;
}

.join {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	width: min(100%, 28rem);
}

.lobby {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 1rem clamp(0.75rem, 3vw, 2rem) 1.5rem;
}

.lobby.under-banner {
	padding-top: 5.5rem;
}

.lobby-head {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
}

.lobby-head h1,
.lobby-head p {
	margin: 0;
}

.lobby-card {
	width: min(100%, 72rem);
}

.lobby-title {
	margin-top: 0;
}

.lobby-form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.join-hint {
	margin: 0;
	font-size: 0.9rem;
}

.big-avatar {
	font-size: 5rem;
	line-height: 1.1;
}

.answering {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.75rem;
}

.timer-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
}

.answering > :last-child {
	flex: 1;
}

.points {
	margin: 0;
	font-size: 2.5rem;
	font-weight: 700;
}

.points.good {
	color: var(--success);
}

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

@keyframes pop {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
}

@media (min-width: 900px) {
	.answering {
		width: min(100%, 56rem);
		margin: 0 auto;
	}
}
</style>
