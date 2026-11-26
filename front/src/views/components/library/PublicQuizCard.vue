<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import type { PublicQuiz } from '@/interfaces/Quiz/QuizInterface';
import { ANSWER_ICONS } from '@/utils/Answers';
import { locale, t, tp } from '@/i18n';
import { auth } from '@/utils/Auth';

const props = defineProps<{
	quiz: PublicQuiz;
	accent: string;
	index: number;
	copying: boolean;
	// On the creator's own card every quiz has the same author: the date moves to the facts instead.
	hideOwner?: boolean;
}>();

const emit = defineEmits<{ copy: []; preview: []; report: [] }>();
const route = useRoute();

// Cover stickers picked from the uid, so each quiz keeps the same ones across visits.
const stickers = computed(() => [0, 3, 6].map((at) => ANSWER_ICONS[props.quiz.uid.charCodeAt(at) % ANSWER_ICONS.length]));
</script>

<template>
	<article class="quiz" :style="{ '--tint': accent, '--delay': `${Math.min(index, 8) * 60}ms` }">
		<header class="cover">
			<span class="stickers" aria-hidden="true">
				<AppIcon v-for="(sticker, stickerIndex) in stickers" :key="stickerIndex" :name="sticker" :class="`sticker s${stickerIndex}`" />
			</span>
			<h2>{{ quiz.title }}</h2>
			<button
				v-if="auth.user && !quiz.isOwn"
				type="button"
				class="report"
				:class="{ reported: quiz.reported }"
				:data-tip="t(quiz.reported ? 'library.alreadyReported' : 'library.report')"
				:aria-label="t(quiz.reported ? 'library.alreadyReported' : 'library.report')"
				:aria-disabled="quiz.reported"
				@click="quiz.reported || emit('report')"
			>
				<AppIcon name="flag" />
			</button>
		</header>

		<div class="body" :class="{ 'no-owner': hideOwner }">
			<RouterLink v-if="!hideOwner" class="owner" :to="`/creators/${quiz.ownerUid}`" :aria-label="t('creator.open', { name: quiz.owner })" :data-tip="t('creator.open', { name: quiz.owner })">
				<span class="avatar"><AvatarIcon :value="quiz.ownerAvatar" /></span>
				<span class="who">
					<NameTag :name="quiz.owner" :look="quiz.ownerAvatar" />
					<small class="muted">{{ new Date(quiz.updatedAt).toLocaleDateString(locale) }}</small>
					<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
				</span>
			</RouterLink>
			<ul class="facts">
				<li><AppIcon name="clipboard" /><strong>{{ quiz.questionsCount }}</strong> {{ tp('dash.questions', quiz.questionsCount) }}</li>
				<li v-if="hideOwner"><AppIcon name="pencil" />{{ new Date(quiz.updatedAt).toLocaleDateString(locale) }}</li>
				<li><AppIcon name="download" /><strong>{{ quiz.downloads }}</strong> {{ tp('library.downloads', quiz.downloads) }}</li>
				<li v-if="quiz.moderation === 'warned'" class="warned"><AppIcon name="warning" />{{ t('library.warned') }}</li>
			</ul>
			<div class="actions">
				<BaseButton variant="secondary" @click="emit('preview')"><AppIcon name="search" /> {{ t('library.preview') }}</BaseButton>
				<BaseButton v-if="auth.user" variant="success" :loading="copying" :disabled="quiz.copied" :data-tip="t(quiz.copied ? 'library.alreadyCopiedTip' : 'library.copyTip')" @click="emit('copy')"><AppIcon name="plus" /> {{ t(quiz.copied ? 'library.alreadyCopied' : 'library.copy') }}</BaseButton>
				<BaseButton v-else variant="ghost" :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">{{ t('library.logInToCopy') }}</BaseButton>
			</div>
		</div>
	</article>
</template>

<style scoped>
/* No overflow: hidden here or on the cover: it would clip the report button's tooltip. */
.quiz {
	position: relative;
	display: flex;
	flex-direction: column;
	border: 2px solid color-mix(in srgb, var(--tint) 45%, var(--border));
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--tint) 55%, black), var(--shadow);
	animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) backwards;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Raised so a tooltip spilling out of the card stays above the next card. */
.quiz:hover,
.quiz:focus-within {
	z-index: 1;
	transform: translateY(-4px);
	box-shadow: 0 0.6rem 0 color-mix(in srgb, var(--tint) 55%, black), var(--shadow);
}

@keyframes pop-in {
	from {
		opacity: 0;
		transform: translateY(12px) scale(0.96);
	}
}

/* Cover: tinted band with the title and a few answer-shape stickers peeking from the right. */
.cover {
	position: relative;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	min-height: 6.5rem;
	padding: 1.1rem 1.25rem 1.6rem;
	border-radius: calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0;
	background:
		radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--tint) 30%, transparent), transparent 60%),
		color-mix(in srgb, var(--tint) 22%, var(--surface));
}

.cover h2 {
	position: relative;
	flex: 1;
	margin: 0;
	padding-right: 3.5rem;
	font-size: 1.35rem;
	line-height: 1.2;
	overflow-wrap: anywhere;
}

/* The sticker layer does the clipping, so the stickers still peek from the cover edge. */
.stickers {
	position: absolute;
	inset: 0;
	overflow: hidden;
	border-radius: inherit;
	pointer-events: none;
}

.sticker {
	position: absolute;
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.s0 {
	right: -0.6rem;
	bottom: -0.9rem;
	font-size: 3.6rem;
	transform: rotate(-14deg);
}

.s1 {
	right: 2.6rem;
	bottom: 0.3rem;
	font-size: 1.7rem;
	transform: rotate(12deg);
	opacity: 0.85;
}

.s2 {
	right: 0.9rem;
	top: 2.9rem;
	font-size: 1.1rem;
	transform: rotate(24deg);
	opacity: 0.7;
}

.quiz:hover .s0 {
	transform: rotate(-4deg) scale(1.08);
}

.quiz:hover .s1 {
	transform: rotate(-8deg) translateY(-3px);
}

.quiz:hover .s2 {
	transform: rotate(40deg) scale(1.15);
}

.report {
	position: relative;
	display: inline-grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.1rem;
	height: 2.1rem;
	border: 2px solid transparent;
	border-radius: 50%;
	background: color-mix(in srgb, var(--surface) 70%, transparent);
	cursor: pointer;
	transition: border-color 0.15s;
}

/* Only the icon wiggles: the data-tip tooltip is drawn on the button and would rotate with it. */
.report .app-icon {
	transition: transform 0.15s;
}

.report:hover,
.report:focus-visible {
	border-color: var(--danger);
}

.report:hover .app-icon,
.report:focus-visible .app-icon {
	transform: rotate(-10deg) scale(1.08);
}

/* Filled = the viewer's report is waiting for a moderator. */
.report.reported {
	border-color: var(--danger);
	background: color-mix(in srgb, var(--danger) 35%, var(--surface));
	cursor: default;
}

.report.reported .app-icon {
	transform: none;
}

.body {
	display: flex;
	flex: 1;
	flex-direction: column;
	padding: 0 1.25rem 1.25rem;
}

.body.no-owner {
	padding-top: 1rem;
}

/* Avatar bubble overlapping the cover edge; relative so it paints above the (positioned) cover. Links to the creator card. */
.owner {
	position: relative;
	display: flex;
	align-self: flex-start;
	align-items: flex-end;
	gap: 0.6rem;
	max-width: 100%;
	margin: -1.5rem 0 0.9rem;
	color: inherit;
	text-decoration: none;
}

.owner:hover .avatar,
.owner:focus-visible .avatar {
	transform: translateY(-2px) rotate(-6deg);
}

.owner:focus-visible {
	outline: none;
}

.owner:focus-visible .who {
	box-shadow: 0 0 0 3px var(--focus-ring);
}

.avatar {
	position: relative;
	transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	display: inline-grid;
	flex-shrink: 0;
	place-items: center;
	width: 3.2rem;
	height: 3.2rem;
	border: 3px solid var(--tint);
	border-radius: 50%;
	background: var(--surface);
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--tint) 55%, black);
	font-size: 1.75rem;
}

/* Pill with a chevron so the author reads as a link to their creator card. One line, so it stays below the cover edge.
   No overflow: hidden: NameTag's tilt and effects draw outside its box (it ellipsizes itself). */
.who {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	min-width: 0;
	padding: 0.2rem 0.35rem 0.2rem 0.3rem;
	border: 2px solid color-mix(in srgb, var(--tint) 35%, var(--border));
	border-radius: 999px;
	background: var(--surface-2);
	font-size: 0.95rem;
	white-space: nowrap;
	transition: border-color 0.15s, background-color 0.15s;
}

.owner:hover .who,
.owner:focus-visible .who {
	border-color: var(--tint);
	background: color-mix(in srgb, var(--tint) 18%, var(--surface-2));
}

.chevron {
	flex-shrink: 0;
	width: 1rem;
	height: 1rem;
	fill: none;
	stroke: var(--text-muted);
	stroke-width: 3;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.15s;
}

.owner:hover .chevron,
.owner:focus-visible .chevron {
	stroke: var(--text);
	transform: translateX(2px);
}

.who small {
	flex-shrink: 0;
	font-size: 0.8rem;
}

.facts {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: auto 0 1rem;
	padding: 0;
	list-style: none;
	color: var(--text-muted);
	font-size: 0.85rem;
}

.facts li {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.25rem 0.7rem 0.25rem 0.45rem;
	border-radius: 999px;
	background: var(--surface-2);
}

.facts strong {
	color: var(--text);
}

.facts .warned {
	background: color-mix(in srgb, var(--color-3) 20%, transparent);
	color: var(--text);
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.actions > * {
	flex: 1 1 auto;
}
</style>
