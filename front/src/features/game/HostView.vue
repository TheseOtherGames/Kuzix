<script setup lang="ts">
import { t, tp } from '../../shared/i18n/i18n';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AnswerChart from './AnswerChart.vue';
import AnswerGrid from './AnswerGrid.vue';
import CountdownNumber from './CountdownNumber.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import InfoTip from '../../shared/ui/InfoTip.vue';
import GameBar from './GameBar.vue';
import Leaderboard from '../../shared/ui/Leaderboard.vue';
import AppIcon from '../../shared/ui/AppIcon.vue';
import AvatarIcon from '../../shared/ui/AvatarIcon.vue';
import NameTag from '../../shared/ui/NameTag.vue';
import PlayerChip from './PlayerChip.vue';
import TimerRing from './TimerRing.vue';
import type { RevealMode } from '../quiz/quiz.types';
import type { MessageKey } from '../../shared/i18n/en';
import { POINTS_PER_DIFFICULTY } from '../../shared/answers';
import type { HostState, PlayerPublic } from './game.types';
import { GameSocket } from './game.socket';
import { api } from '../../shared/api';
import { auth } from '../auth/auth.store';
import { toast } from '../../shared/toast.store';

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
const joinLink = computed(() => (state.value ? `${location.origin}/play/${state.value.code}` : ''));
const joinLinkShort = computed(() => joinLink.value.replace(/^https?:\/\//, ''));

const socket = new GameSocket(
	() => ({ type: 'host', quizId: Number(route.params.id), token: auth.token ?? '' }),
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

const answeredCount = computed(() => state.value?.players.filter((player) => player.answered).length ?? 0);
// Podium columns in display order (2nd, 1st, 3rd); `step` is the place, which also sets the reveal order (3rd first).
const podium = computed(() => [1, 0, 2]
	.map((i) => ({ player: state.value?.players[i], step: i + 1 }))
	.filter((spot): spot is { player: PlayerPublic; step: number } => Boolean(spot.player)));

const showReveal = computed(() => state.value?.phase === 'reveal' && state.value.revealMode === 'question');
const isLastQuestion = computed(() => state.value?.question?.index === (state.value?.questionsCount ?? 0) - 1);

const nextLabel = computed(() => {
	if (state.value?.phase === 'lobby') {
		return t('host.start');
	}
	return isLastQuestion.value ? t('host.final') : t('host.next');
});

const next = (): void => socket.send({ type: 'next' });
const togglePause = (): void => socket.send({ type: 'pause', paused: !state.value?.paused });
const MAX_COUNTDOWN = 10;

// Out-of-range or empty input snaps back to the current value instead of being sent.
const onCountdownChange = (event: Event): void => {
	const input = event.target as HTMLInputElement;
	const seconds = Number(input.value);
	if (input.value !== '' && Number.isInteger(seconds) && seconds >= 0 && seconds <= MAX_COUNTDOWN) {
		sendSettings({ countdown: seconds });
	} else {
		input.value = String(state.value?.countdownSeconds ?? 0);
	}
};

const sendSettings = (change: { revealMode?: RevealMode; countdown?: number }): void => {
	socket.send({
		type: 'settings',
		revealMode: change.revealMode ?? state.value!.revealMode,
		countdown: change.countdown ?? state.value!.countdownSeconds,
	});
};

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

// Native share sheet on phones/tablets, clipboard elsewhere.
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

const codeCopied = ref(false);
const copyCode = async (): Promise<void> => {
	try {
		await navigator.clipboard.writeText(state.value?.code ?? '');
		toast.success(t('host.codeCopied'));
		codeCopied.value = true;
		setTimeout(() => (codeCopied.value = false), 1500);
	} catch (error) {
		toast.error((error as Error).message);
	}
};

const shareLink = async (): Promise<void> => {
	try {
		if (navigator.share) {
			await navigator.share({ title: state.value?.title, url: joinLink.value });
			return;
		}
		await navigator.clipboard.writeText(joinLink.value);
		toast.success(t('dash.linkCopied'));
	} catch (error) {
		if ((error as Error).name !== 'AbortError') {
			toast.error((error as Error).message);
		}
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

		<section v-else-if="state.paused" class="paused">
			<span class="pause-icon"><AppIcon name="pause" /></span>
			<h1>{{ t('host.pausedTitle') }}</h1>
			<p class="muted">{{ t('host.pausedText') }}</p>
			<BaseButton size="lg" variant="success" @click="togglePause"><AppIcon name="play" /> {{ t('host.resumeBtn') }}</BaseButton>
		</section>

		<section v-else-if="state.phase === 'lobby'" class="lobby">
			<div class="lobby-card">
				<section class="lobby-join">
					<div class="join-text">
						<p class="join-label">{{ t('host.joinAt') }}</p>
						<p class="link selectable">{{ joinLinkShort }}</p>
						<p class="join-label">{{ t('host.withCode') }}</p>
						<div class="join-actions">
							<BaseButton variant="secondary" @click="shareLink"><AppIcon name="link" /> {{ t('host.share') }}</BaseButton>
							<BaseButton variant="ghost" @click="recodeOpen = true"><AppIcon name="refresh" /> {{ t('dash.newCode') }}</BaseButton>
						</div>
					</div>
					<p class="code">
						<span class="selectable">{{ state.code }}</span>
						<button type="button" :class="['copy-code', { done: codeCopied }]" :title="t('host.copyCode')" :aria-label="t('host.copyCode')" @click="copyCode"><AppIcon :name="codeCopied ? 'check' : 'clipboard'" /></button>
					</p>
				</section>

				<section class="lobby-roster">
					<h2 class="roster-title">
						<span class="roster-count">{{ state.players.length }}</span>
						{{ tp('host.roster', state.players.length) }}
					</h2>
					<div class="players">
						<PlayerChip
							v-for="player in state.players"
							:key="player.id"
							:avatar="player.avatar"
							:nickname="player.nickname"
							:dimmed="!player.connected"
							removable
							@remove="askKick(player)"
						/>
						<p v-if="!state.players.length" class="waiting muted">{{ t('host.waitingPlayers') }}</p>
					</div>
				</section>

				<footer class="lobby-start">
					<BaseButton size="lg" variant="success" :disabled="!state.players.length" @click="next">{{ nextLabel }}</BaseButton>
				</footer>
			</div>
		</section>

		<section v-else-if="state.phase === 'countdown' && state.countdown" class="countdown-screen">
			<p class="countdown-label">{{ t('host.questionOf', { n: state.countdown.index + 1, total: state.questionsCount }) }}</p>
			<CountdownNumber :remaining-ms="state.countdown.remainingMs" :running="!state.paused" />
			<p class="countdown-ready">{{ t('host.getReady') }}</p>
		</section>

		<section v-else-if="state.question && (state.phase === 'question' || state.phase === 'reveal')" class="board">
			<h1 class="question">
				{{ state.question.text }}
				<span v-if="state.question.cancelled" class="cancelled-badge"><AppIcon name="ban" /> {{ t('host.cancelledBadge') }}</span>
			</h1>

			<div class="stage">
				<div class="timer-slot">
					<TimerRing
						:remaining-ms="state.question.remainingMs"
						:duration="state.question.timeLimit"
						:running="state.phase === 'question'"
					/>
					<p class="difficulty" :title="t('q.difficulty')">
						<span class="stars" aria-hidden="true"><span v-for="n in 5" :key="n" :class="{ on: n <= state.question.difficulty }">★</span></span>
						<span>{{ t(`q.level.${state.question.difficulty}` as MessageKey) }} · {{ state.question.difficulty * POINTS_PER_DIFFICULTY }} pts</span>
					</p>
				</div>

				<div class="center-stage">
					<AnswerChart v-if="showReveal && state.reveal" :counts="state.reveal.counts" :correct="state.reveal.correct" />
					<p v-else-if="state.phase === 'reveal'" class="locked"><AppIcon name="lock" /> {{ t('host.locked') }}</p>
					<div v-else class="progress">
						<p class="progress-count"><strong>{{ answeredCount }}</strong> / {{ state.players.length }}</p>
						<p class="muted">{{ t('host.answeredLabel') }}</p>
						<div class="progress-track"><div class="progress-fill" :style="{ width: `${(answeredCount / Math.max(1, state.players.length)) * 100}%` }"></div></div>
					</div>
				</div>

				<div class="side">
					<template v-if="state.phase === 'reveal'">
						<Leaderboard v-if="showReveal && !isLastQuestion" :entries="state.players" :limit="5" />
						<BaseButton size="lg" block @click="next">{{ nextLabel }}</BaseButton>
						<BaseButton v-if="!state.question.cancelled" variant="ghost" block @click="cancelOpen = true"><AppIcon name="ban" /> {{ t('host.cancelQ') }}</BaseButton>
					</template>
				</div>
			</div>

			<AnswerGrid
				class="answers"
				:count="state.question.answers.length"
				:texts="state.question.answers"
				:correct="showReveal ? state.reveal?.correct : null"
				:counts="showReveal ? state.reveal?.counts : null"
				disabled
			/>
		</section>

		<section v-else-if="state.phase === 'end'" class="end">
			<h1 class="end-title"><AppIcon name="trophy" /> {{ t('host.ranking') }}</h1>
			<ol class="podium" :aria-label="t('host.podium')">
				<li v-for="spot in podium" :key="spot.player.id" class="spot" :class="`place-${spot.step}`">
					<div class="winner">
						<span class="winner-avatar" aria-hidden="true"><AvatarIcon :value="spot.player.avatar" /></span>
						<NameTag :name="spot.player.nickname" :look="spot.player.avatar" />
						<strong class="winner-score">{{ t('play.points', { n: spot.player.score }) }}</strong>
					</div>
					<div class="step"><span><AppIcon v-if="spot.player.rank <= 3" :name="['medal-gold', 'medal-silver', 'medal-bronze'][spot.player.rank - 1]" /><template v-else>{{ spot.player.rank }}</template></span></div>
				</li>
			</ol>
			<Leaderboard v-if="state.players.length > 3" class="rest" :entries="state.players.slice(3)" />
			<BaseButton to="/dashboard" size="lg">{{ t('host.backDashboard') }}</BaseButton>
		</section>

		<BaseModal :open="settingsOpen" :title="t('host.settings')" @close="settingsOpen = false">
			<fieldset class="setting">
				<legend>{{ t('editor.reveal') }}<InfoTip :text="t('editor.revealInfo')" /></legend>
				<label class="option">
					<input type="radio" name="reveal" value="question" :checked="state?.revealMode === 'question'" @change="sendSettings({ revealMode: 'question' })" />
					{{ t('editor.revealQuestion') }}
				</label>
				<label class="option">
					<input type="radio" name="reveal" value="end" :checked="state?.revealMode === 'end'" @change="sendSettings({ revealMode: 'end' })" />
					{{ t('editor.revealEnd') }}
				</label>
			</fieldset>
			<label class="setting countdown-setting">
				<span>{{ t('editor.countdown') }}<InfoTip :text="t('editor.countdownInfo')" /></span>
				<span class="with-unit">
					<input
						type="number"
						min="0"
						:max="MAX_COUNTDOWN"
						step="1"
						inputmode="numeric"
						:value="state?.countdownSeconds"
						@change="onCountdownChange"
					/>
					<span class="unit" aria-hidden="true">s</span>
				</span>
			</label>
			<p class="muted hint">{{ t('host.settingsHint') }}</p>
			<template #actions>
				<BaseButton @click="settingsOpen = false">{{ t('common.close') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="playersOpen" :title="t('host.players')" @close="playersOpen = false">
			<p class="muted hint-top">{{ t('host.playersHint') }}</p>
			<div class="modal-players">
				<PlayerChip
					v-for="player in state?.players ?? []"
					:key="player.id"
					:avatar="player.avatar"
					:nickname="player.nickname"
					:dimmed="!player.connected"
					removable
					@remove="askKick(player)"
				/>
			</div>
			<template #actions>
				<BaseButton @click="playersOpen = false">{{ t('common.close') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="Boolean(kickTarget)" :title="t('host.kickTitle', { name: kickTarget?.nickname ?? '' })" @close="kickTarget = null">
			<p>{{ t('host.kickText') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="kickTarget = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="kick">{{ t('host.kickConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="recodeOpen" :title="t('dash.newCodeTitle')" @close="recodeOpen = false">
			<p>{{ t('dash.newCodeText', { code: state?.code ?? '' }) }}</p>
			<p class="muted">{{ t('dash.newCodeAuto') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="recodeOpen = false">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="regenerateCode"><AppIcon name="refresh" /> {{ t('dash.newCodeConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="cancelOpen" :title="t('host.cancelQTitle')" @close="cancelOpen = false">
			<p>{{ t('host.cancelQText') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="cancelOpen = false">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="cancelQuestion">{{ t('host.cancelQConfirm') }}</BaseButton>
			</template>
		</BaseModal>

		<BaseModal :open="stopOpen" :title="t('host.stopTitle')" @close="stopOpen = false">
			<p>{{ t('host.stopText') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="stopOpen = false">{{ t('common.cancel') }}</BaseButton>
				<BaseButton variant="danger" @click="stop"><AppIcon name="stop" /> {{ t('host.stopConfirm') }}</BaseButton>
			</template>
		</BaseModal>
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

/* Pause */
.paused {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 2rem;
	text-align: center;
}

.paused h1 {
	font-size: clamp(2rem, 5vw, 4rem);
}

.paused .muted {
	font-size: clamp(1rem, 2vw, 1.5rem);
}

.pause-icon {
	display: grid;
	place-items: center;
	width: clamp(6rem, 18vw, 11rem);
	aspect-ratio: 1;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0.4rem 0 color-mix(in srgb, var(--accent) 55%, black);
	color: var(--on-accent);
	font-size: clamp(3rem, 9vw, 5.5rem);
	animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
	50% {
		transform: scale(1.06);
	}
}

/* Lobby: one card, three sections (join · players · start). */
.lobby {
	display: flex;
	flex: 1;
	min-height: 0;
	padding: clamp(0.75rem, 2.5vw, 2rem);
}

.lobby-card {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-height: 0;
	border: 1px solid var(--border);
	border-radius: calc(var(--radius) * 1.5);
	background: color-mix(in srgb, var(--surface) 90%, transparent);
	box-shadow: var(--shadow);
}

.lobby-card > section,
.lobby-card > footer {
	padding: clamp(1rem, 2.5vw, 2.25rem) clamp(1rem, 3.5vw, 3rem);
}

.lobby-card > * + * {
	border-top: 2px dashed var(--border);
}

.lobby-join {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: clamp(1rem, 4vw, 4rem);
}

.join-text {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: clamp(0.3rem, 1vh, 0.75rem);
}

.join-label {
	margin: 0;
	color: var(--text-muted);
	font-size: clamp(1rem, 1.9vw, 1.6rem);
	font-weight: 600;
}

.link {
	margin: 0;
	font-size: clamp(1.3rem, 2.8vw, 2.4rem);
	font-weight: 700;
	overflow-wrap: anywhere;
}

.join-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.code {
	display: flex;
	align-items: center;
	gap: 0.15em;
	margin: 0;
	padding: 0.12em 0.4em;
	border-radius: var(--radius);
	background: var(--color-3);
	box-shadow: 0 0.4rem 0 color-mix(in srgb, var(--color-3) 55%, black);
	color: #1e2230;
	font-family: var(--font-mono);
	font-size: clamp(2.8rem, 9vw, 8rem);
	font-weight: 700;
	line-height: 1;
	letter-spacing: 0.08em;
}

.copy-code {
	--tile: color-mix(in srgb, var(--color-3) 80%, white);
	display: grid;
	place-items: center;
	align-self: center;
	margin-left: 0.25em;
	padding: 0.35em;
	border: 0.06em solid color-mix(in srgb, var(--color-3) 55%, black);
	border-radius: var(--radius-sm);
	background: var(--tile);
	box-shadow: 0 0.12em 0 color-mix(in srgb, var(--color-3) 55%, black);
	color: inherit;
	font-size: 0.32em;
	letter-spacing: 0;
	cursor: pointer;
	transition: transform 0.12s, box-shadow 0.12s, background 0.2s;
}

.copy-code:hover {
	--tile: white;
	transform: translateY(-0.04em) rotate(-4deg);
	box-shadow: 0 0.16em 0 color-mix(in srgb, var(--color-3) 55%, black);
}

.copy-code:active {
	transform: translateY(0.1em);
	box-shadow: 0 0.02em 0 color-mix(in srgb, var(--color-3) 55%, black);
}

.copy-code.done {
	--tile: color-mix(in srgb, var(--color-4) 70%, white);
	border-color: color-mix(in srgb, var(--color-4) 55%, black);
	box-shadow: 0 0.12em 0 color-mix(in srgb, var(--color-4) 55%, black);
}

.lobby-roster {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 1rem;
	min-height: 0;
}

.roster-title {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 0;
	font-size: clamp(1.3rem, 2.4vw, 2rem);
}

.roster-count {
	display: grid;
	place-items: center;
	min-width: 1.8em;
	padding: 0 0.4em;
	border-radius: 999px;
	background: var(--accent);
	color: var(--on-accent);
}

.players {
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	align-content: flex-start;
	gap: 0.6rem;
	min-height: 0;
	overflow-y: auto;
}

.players :deep(.chip) {
	padding: 0.4em 1em 0.4em 0.5em;
	font-size: clamp(1.1rem, 1.9vw, 1.6rem);
}

.waiting {
	margin: auto;
	font-size: clamp(1rem, 2vw, 1.5rem);
	animation: breathe 2s ease-in-out infinite;
}

.lobby-start {
	display: flex;
	justify-content: center;
}

.lobby-start :deep(.btn) {
	min-width: min(100%, 24rem);
	font-size: clamp(1.1rem, 2vw, 1.5rem);
}

/* Countdown before each question */
.countdown-screen {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: clamp(1rem, 3vh, 2rem);
	text-align: center;
}

.countdown-label {
	margin: 0;
	color: var(--text-muted);
	font-size: clamp(1.3rem, 3vw, 2.4rem);
	font-weight: 700;
}

.countdown-ready {
	margin: 0;
	font-size: clamp(2rem, 5vw, 4rem);
	font-weight: 700;
}

/* Question board */
.board {
	display: grid;
	flex: 1;
	grid-template-rows: auto minmax(0, 1fr) auto;
	gap: clamp(0.75rem, 2vh, 1.5rem);
	min-height: 0;
	padding: clamp(0.5rem, 2vh, 1.5rem) clamp(0.75rem, 2.5vw, 2rem) clamp(0.75rem, 2.5vh, 2rem);
}

.question {
	margin: 0;
	padding: clamp(0.75rem, 2vh, 1.5rem) clamp(1rem, 3vw, 2.5rem);
	border-radius: calc(var(--radius) * 1.5);
	background: var(--surface);
	box-shadow: var(--shadow);
	font-size: clamp(1.6rem, 4vw, 3.6rem);
	line-height: 1.15;
	text-align: center;
	overflow-wrap: anywhere;
}

.cancelled-badge {
	display: block;
	width: fit-content;
	margin: 0.5rem auto 0;
	padding: 0.2em 0.8em;
	border-radius: 999px;
	background: var(--btn-danger);
	color: var(--on-color);
	font-size: clamp(0.9rem, 1.6vw, 1.3rem);
}

.stage {
	display: grid;
	/* Symmetric side columns keep the chart/progress centred on the screen. */
	grid-template-columns: minmax(10rem, 22rem) minmax(0, 1fr) minmax(10rem, 22rem);
	align-items: center;
	gap: clamp(0.75rem, 2vw, 2rem);
	min-height: 0;
}

.timer-slot {
	display: grid;
	place-items: center;
	gap: 0.75rem;
}

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
	letter-spacing: 0.1em;
	color: color-mix(in srgb, var(--text-muted) 35%, transparent);
	font-size: 1.2em;
	line-height: 1;
}

.stars .on {
	color: var(--color-3);
	text-shadow: 0 0.08em 0 color-mix(in srgb, var(--color-3) 55%, black);
}

.timer-slot :deep(.timer) {
	width: clamp(6rem, 14vw, 12rem);
	height: clamp(6rem, 14vw, 12rem);
	font-size: clamp(2rem, 4.5vw, 4rem);
}

.center-stage {
	display: grid;
	place-items: center;
	height: 100%;
	min-height: 0;
	padding-block: 0.5rem;
}

.center-stage > .chart {
	width: 100%;
}

.progress {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: min(100%, 28rem);
	text-align: center;
}

.progress p {
	margin: 0;
}

.progress-count {
	color: var(--text-muted);
	font-size: clamp(1.6rem, 3vw, 2.6rem);
	font-weight: 600;
}

.progress-count strong {
	color: var(--text);
	font-size: clamp(3.5rem, 9vw, 7.5rem);
	line-height: 1;
}

.progress .muted {
	font-size: clamp(1rem, 1.8vw, 1.4rem);
}

.progress-track {
	width: 100%;
	height: 0.6rem;
	margin-top: 1rem;
	overflow: hidden;
	border-radius: 999px;
	background: var(--surface-2);
}

.progress-fill {
	height: 100%;
	border-radius: inherit;
	background: var(--accent);
	transition: width 0.4s ease;
}

.locked {
	margin: 0;
	font-size: clamp(1.3rem, 2.6vw, 2.2rem);
	font-weight: 600;
	text-align: center;
}

.side {
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.75rem;
	min-height: 0;
	overflow: hidden;
}

.answers {
	--tile-min-height: clamp(3.5rem, 10vh, 7rem);
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: clamp(0.5rem, 1.5vh, 1rem) clamp(0.5rem, 1.5vw, 1rem);
}

.answers :deep(.tile) {
	min-height: var(--tile-min-height);
}

.answers :deep(.text) {
	font-size: clamp(1.1rem, 2.4vw, 2.1rem);
}

.answers :deep(.symbol) {
	font-size: clamp(1.6rem, 3vw, 2.6rem);
}

/* End */
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

/* Podium: steps rise 3rd → 2nd → 1st, each player pops in once their step is up, then the rest fades in. */
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

.rest {
	animation: fade-in 0.6s ease-out 4.8s backwards;
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

@keyframes fade-in {
	from {
		opacity: 0;
	}
}

/* Settings popup */
.setting {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	border: none;
}

.setting legend {
	margin-bottom: 0.5rem;
	font-weight: 600;
}

.option {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 400;
	cursor: pointer;
}

.hint-top {
	margin: 0 0 0.75rem;
}

.modal-players {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* Inside the popup the remove button is always visible: that's what the popup is for. */
.modal-players :deep(.remove) {
	opacity: 1;
}

.countdown-setting {
	margin-top: 1.25rem;
}

.countdown-setting > span:first-child {
	display: block;
	margin-bottom: 0.4rem;
	font-weight: 600;
}

.with-unit {
	position: relative;
	display: block;
	max-width: 10rem;
}

.with-unit input {
	padding-right: 2rem;
}

.unit {
	position: absolute;
	top: 50%;
	right: 0.9rem;
	color: var(--text-muted);
	transform: translateY(-50%);
	pointer-events: none;
}

.hint {
	margin: 1rem 0 0;
	font-size: 0.9rem;
}

/* Small screens (the host on a laptop or tablet): stack, allow scrolling. */
@media (max-width: 860px) {
	.host {
		height: auto;
		min-height: 100dvh;
		overflow: visible;
	}

	.lobby-join {
		grid-template-columns: minmax(0, 1fr);
		justify-items: center;
		text-align: center;
	}

	.join-text {
		align-items: center;
	}

	.stage {
		grid-template-columns: auto minmax(0, 1fr);
	}

	.side {
		grid-column: 1 / -1;
	}

	.answers {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
