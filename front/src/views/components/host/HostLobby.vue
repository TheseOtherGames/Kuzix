<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import PlayerChip from '@/views/components/game/PlayerChip.vue';
import type { PlayerPublic } from '@/interfaces/Game/GameInterface';
import { t, tp } from '@/i18n';
import { copyText } from '@/utils/Clipboard';
import { toast } from '@/utils/Toast';

const props = defineProps<{
	title: string;
	code: string;
	players: PlayerPublic[];
}>();

const emit = defineEmits<{ recode: []; kick: [player: PlayerPublic]; start: [] }>();

const joinLink = computed(() => `${location.origin}/play/${props.code}`);
const joinLinkShort = computed(() => joinLink.value.replace(/^https?:\/\//, ''));

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
			<section class="lobby-join">
				<div class="join-text">
					<p class="join-label">{{ t('host.joinAt') }}</p>
					<p class="link selectable">{{ joinLinkShort }}</p>
					<p class="join-label">{{ t('host.withCode') }}</p>
					<div class="join-actions">
						<BaseButton variant="secondary" @click="shareLink"><AppIcon name="link" /> {{ t('host.share') }}</BaseButton>
						<BaseButton variant="ghost" @click="emit('recode')"><AppIcon name="refresh" /> {{ t('dash.newCode') }}</BaseButton>
					</div>
				</div>
				<p class="code">
					<span class="selectable">{{ code }}</span>
					<button type="button" :class="['copy-code', { done: codeCopied }]" :title="t('host.copyCode')" :aria-label="t('host.copyCode')" @click="copyCode"><AppIcon :name="codeCopied ? 'check' : 'clipboard'" /></button>
				</p>
			</section>

			<section class="lobby-roster">
				<h2 class="roster-title">
					<span class="roster-count">{{ players.length }}</span>
					{{ tp('host.roster', players.length) }}
				</h2>
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
					<p v-if="!players.length" class="waiting muted">{{ t('host.waitingPlayers') }}</p>
				</div>
			</section>

			<footer class="lobby-start">
				<BaseButton size="lg" variant="success" :disabled="!players.length" @click="emit('start')">{{ t('host.start') }}</BaseButton>
			</footer>
		</div>
	</section>
</template>

<style scoped>
/* One card, three sections (join · players · start). */
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

@keyframes breathe {
	50% {
		transform: scale(1.06);
	}
}

@media (max-width: 860px) {
	.lobby-join {
		grid-template-columns: minmax(0, 1fr);
		justify-items: center;
		text-align: center;
	}

	.join-text {
		align-items: center;
	}
}
</style>
