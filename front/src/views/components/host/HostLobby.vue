<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import QrCode from '@/views/components/utils/image/QrCode.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import ProgressBar from '@/views/components/utils/progress/ProgressBar.vue';
import PlayerChip from '@/views/components/game/PlayerChip.vue';
import type { PlayerPublic } from '@/interfaces/Game/GameInterface';
import type { RevealMode } from '@/interfaces/Quiz/QuizInterface';
import { t, tp } from '@/i18n';
import { copyText } from '@/utils/Clipboard';
import { toast } from '@/utils/Toast';

const props = defineProps<{
	title: string;
	code: string;
	players: PlayerPublic[];
	questionsCount: number;
	revealMode: RevealMode;
	countdown: number;
	maxPlayers: number | null;
}>();

const emit = defineEmits<{ recode: []; kick: [player: PlayerPublic]; start: []; settings: [] }>();

const joinLink = computed(() => `${location.origin}/play/${props.code}`);
// The home page has the code form, so the bare host is all players need to type.
const joinLinkShort = location.host;

const seatsRatio = computed(() => (props.maxPlayers ? props.players.length / props.maxPlayers : 0));
const seatsColor = computed(() => {
	if (seatsRatio.value >= 1) {
		return 'var(--btn-danger)';
	}

	return seatsRatio.value >= 0.8 ? 'var(--color-3)' : 'var(--accent)';
});

const facts = computed(() => {
	const endReveal = props.revealMode === 'end';
	const questions = { icon: 'page', text: tp('host.questionsCount', props.questionsCount) };
	const reveal = { icon: endReveal ? 'trophy' : 'chart', text: t(endReveal ? 'host.revealEnd' : 'host.revealQuestion') };
	const countdown = { icon: 'play', text: props.countdown ? t('host.countdownOn', { n: props.countdown }) : t('host.countdownOff') };

	return [questions, reveal, countdown];
});

const codeCopied = ref(false);
const copyCode = async (): Promise<void> => {
	if (await copyText(props.code, t('host.codeCopied'))) {
		codeCopied.value = true;
		setTimeout(() => (codeCopied.value = false), 1500);
	}
};

// Native share sheet on phones/tablets, clipboard elsewhere.
const shareLink = async (): Promise<void> => {
	try {
		if (navigator.share) {
			await navigator.share({ title: props.title, url: joinLink.value });

			return;
		}
		await copyText(joinLink.value, t('dash.linkCopied'));
	} catch (error) {
		if ((error as Error).name !== 'AbortError') {
			toast.error((error as Error).message);
		}
	}
};
</script>

<template>
	<section class="lobby">
		<div class="lobby-card">
			<aside class="join" aria-labelledby="join-title">
				<h2 id="join-title" class="join-title">{{ t('host.joinTitle') }}</h2>
				<ol class="steps">
					<li class="step">
						<span class="num" aria-hidden="true">1</span>
						<div class="step-body">
							<p class="step-label">{{ t('host.step.link') }}</p>
							<p class="link selectable">{{ joinLinkShort }}</p>
						</div>
					</li>
					<li class="step">
						<span class="num" aria-hidden="true">2</span>
						<div class="step-body">
							<p class="step-label">{{ t('host.step.code') }}</p>
							<p class="code">
								<span class="selectable">{{ code }}</span>
								<button type="button" :class="['copy-code', { done: codeCopied }]" :aria-label="t('host.copyCode')" :data-tip="codeCopied ? t('host.codeCopied') : t('host.copyCode')" @click="copyCode"><AppIcon :name="codeCopied ? 'check' : 'clipboard'" /></button>
							</p>
						</div>
					</li>
					<li class="step">
						<span class="num" aria-hidden="true">3</span>
						<div class="step-body">
							<p class="step-label">{{ t('host.step.scan') }}</p>
							<QrCode class="qr" :value="joinLink" :label="t('host.qrCode')" />
						</div>
					</li>
				</ol>
				<div class="join-actions">
					<BaseButton size="sm" variant="secondary" @click="shareLink"><AppIcon name="link" /> {{ t('host.share') }}</BaseButton>
					<BaseButton size="sm" variant="ghost" @click="emit('recode')"><AppIcon name="refresh" /> {{ t('dash.newCode') }}</BaseButton>
				</div>
			</aside>

			<div class="room">
				<header class="room-head">
					<h2 class="roster-title">
						<span class="roster-count">{{ players.length }}</span>
						{{ tp('host.roster', players.length) }}
					</h2>
					<div v-if="maxPlayers" class="seats">
						<span v-if="seatsRatio >= 1" class="full"><AppIcon name="lock" /> {{ t('host.full') }}</span>
						<span v-else class="muted">{{ t('host.seats', { n: players.length, max: maxPlayers }) }}</span>
						<ProgressBar class="seats-bar" :ratio="seatsRatio" :color="seatsColor" />
					</div>
				</header>

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
					<div v-if="!players.length" class="waiting">
						<span class="waiting-icon"><AppIcon name="players" /></span>
						<p class="muted">{{ t('host.waitingPlayers') }}</p>
					</div>
				</div>

				<footer class="room-foot">
					<ul class="facts">
						<li v-for="fact in facts" :key="fact.icon" class="fact"><AppIcon :name="fact.icon" /> {{ fact.text }}</li>
						<li><BaseButton size="sm" variant="ghost" @click="emit('settings')"><AppIcon name="gear" /> {{ t('host.settings') }}</BaseButton></li>
					</ul>
					<div class="start">
						<BaseButton size="lg" variant="success" :disabled="!players.length" :data-tip="players.length ? undefined : t('host.startHint')" @click="emit('start')"><AppIcon name="play" /> {{ t('host.start') }}</BaseButton>
					</div>
				</footer>
			</div>
		</div>
	</section>
</template>

<style scoped>
/* One card: join panel (left) · room (roster + setup + start). Sized for a projector, stacks on small screens. */
.lobby {
	display: flex;
	flex: 1;
	min-height: 0;
	padding: clamp(0.75rem, 2.5vw, 2rem);
}

.lobby-card {
	display: grid;
	flex: 1;
	grid-template-columns: minmax(18rem, 1fr) minmax(0, 1.8fr);
	min-height: 0;
	border: 1px solid var(--border);
	border-radius: calc(var(--radius) * 1.5);
	background: color-mix(in srgb, var(--surface) 90%, transparent);
	box-shadow: var(--shadow);
}

/* Join panel */
.join {
	display: flex;
	flex-direction: column;
	gap: clamp(0.75rem, 2vh, 1.5rem);
	min-height: 0;
	padding: clamp(1rem, 2.5vw, 2.25rem);
	overflow-y: auto;
	border-right: 2px dashed var(--border);
	border-radius: calc(var(--radius) * 1.5) 0 0 calc(var(--radius) * 1.5);
	background: color-mix(in srgb, var(--accent) 8%, var(--surface-2));
}

.join-title {
	margin: 0;
	color: var(--accent-text);
	font-size: clamp(0.9rem, 1.4vw, 1.2rem);
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.steps {
	display: flex;
	flex-direction: column;
	gap: clamp(0.75rem, 2.2vh, 1.75rem);
	margin: 0;
	padding: 0;
	list-style: none;
}

.step {
	display: flex;
	align-items: flex-start;
	gap: 0.8rem;
}

.num {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 1.8em;
	height: 1.8em;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0.15rem 0 color-mix(in srgb, var(--accent) 55%, black);
	color: var(--on-accent);
	font-size: clamp(0.95rem, 1.5vw, 1.3rem);
	font-weight: 700;
}

.step-body {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	min-width: 0;
}

.step-label {
	margin: 0;
	color: var(--text-muted);
	font-size: clamp(0.95rem, 1.5vw, 1.3rem);
	font-weight: 600;
	line-height: 1.8;
}

.link {
	margin: 0;
	font-size: clamp(1.3rem, 2.4vw, 2.2rem);
	font-weight: 700;
	line-height: 1.1;
	overflow-wrap: anywhere;
}

.code {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	gap: 0.15em;
	margin: 0;
	padding: 0.12em 0.35em;
	border-radius: var(--radius);
	background: var(--color-3);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--color-3) 55%, black);
	color: #1e2230;
	font-family: var(--font-mono);
	font-size: clamp(2.4rem, min(4.6vw, 9vh), 5.5rem);
	font-weight: 700;
	line-height: 1;
	letter-spacing: 0.08em;
}

.copy-code {
	--tile: color-mix(in srgb, var(--color-3) 80%, white);
	display: grid;
	place-items: center;
	margin-left: 0.2em;
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

.copy-code::before {
	/* The tooltip would inherit the code's mono font. */
	font-family: var(--font);
}

.copy-code:hover {
	--tile: white;
	transform: translateY(-0.04em);
	box-shadow: 0 0.16em 0 color-mix(in srgb, var(--color-3) 55%, black);
}

/* Tilt the icon, not the button, so the tooltip stays straight. */
.copy-code :deep(svg) {
	transition: rotate 0.12s;
}

.copy-code:hover :deep(svg) {
	rotate: -8deg;
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

.qr {
	width: clamp(8rem, min(16vw, 30vh), 20rem);
}

.join-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: auto;
}

/* Room */
.room {
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 0;
}

.room > * {
	padding-inline: clamp(1rem, 3vw, 2.75rem);
}

.room-head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem 2rem;
	padding-block: clamp(1rem, 2.5vw, 2.25rem) 1rem;
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
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--accent) 55%, black);
	color: var(--on-accent);
}

.seats {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	min-width: min(100%, 14rem);
	font-size: clamp(0.9rem, 1.3vw, 1.1rem);
	font-weight: 600;
	text-align: right;
}

.seats-bar {
	height: 0.5rem;
}

.full {
	color: var(--danger);
}

.players {
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	align-content: flex-start;
	gap: 0.6rem;
	min-height: 0;
	padding-block: 0.25rem 1rem;
	overflow-y: auto;
}

.players :deep(.chip) {
	padding: 0.3em 0.9em 0.3em 0.3em;
	font-size: clamp(1.1rem, 1.9vw, 1.6rem);
}

.players :deep(.avatar) {
	width: 1.9em;
	height: 1.9em;
	font-size: 1em;
}

.waiting {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	margin: auto;
	padding-block: 2rem;
	text-align: center;
}

.waiting p {
	margin: 0;
	font-size: clamp(1rem, 2vw, 1.5rem);
}

.waiting-icon {
	display: grid;
	place-items: center;
	width: 2.2em;
	height: 2.2em;
	border-radius: 50%;
	background: color-mix(in srgb, var(--accent) 16%, var(--surface-2));
	color: var(--accent-text);
	font-size: clamp(2.2rem, 4vw, 3.5rem);
	animation: breathe 2s ease-in-out infinite;
}

.room-foot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 1rem 2rem;
	padding-block: clamp(1rem, 2vw, 1.75rem);
	border-top: 2px dashed var(--border);
}

.facts {
	display: flex;
	flex: 1 1 18rem;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
	margin: 0;
	padding: 0;
	list-style: none;
}

.fact {
	display: inline-flex;
	align-items: center;
	gap: 0.4em;
	padding: 0.35em 0.85em;
	border-radius: 999px;
	background: var(--surface-2);
	font-size: clamp(0.85rem, 1.2vw, 1.05rem);
	font-weight: 600;
	white-space: nowrap;
}

.start {
	display: flex;
	justify-content: center;
	margin-left: auto;
}

.start :deep(.btn) {
	min-width: min(100%, 20rem);
	font-size: clamp(1.1rem, 2vw, 1.5rem);
}

@keyframes breathe {
	50% {
		transform: scale(1.06);
	}
}

/* Laptop/tablet host: stack, the page scrolls (HostView). */
@media (max-width: 860px) {
	.lobby-card {
		grid-template-columns: minmax(0, 1fr);
	}

	.join {
		align-items: center;
		overflow: visible;
		border-right: none;
		border-bottom: 2px dashed var(--border);
		border-radius: calc(var(--radius) * 1.5) calc(var(--radius) * 1.5) 0 0;
		text-align: center;
	}

	.step {
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.step-body {
		align-items: center;
	}

	.code {
		align-self: center;
	}

	.join-actions {
		justify-content: center;
	}

	.room-head {
		justify-content: center;
		text-align: center;
	}

	.seats {
		text-align: center;
	}

	.players,
	.facts {
		justify-content: center;
	}

	.players {
		min-height: 10rem;
	}

	.start {
		width: 100%;
		margin-left: 0;
	}
}
</style>
