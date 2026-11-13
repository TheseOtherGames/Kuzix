<script setup lang="ts">
import NameTag from '@/shared/ui/NameTag.vue';
import AppIcon from '@/shared/ui/AppIcon.vue';
import AvatarIcon from '@/shared/ui/AvatarIcon.vue';
import { computed } from 'vue';
import type { PlayerAnswerDetail } from '@/features/quiz/quiz.types';
import { t } from '@/shared/i18n/i18n';

const MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'];

const props = defineProps<{
	player: { avatar: string; nickname: string; score: number; rank: number | null };
	playersCount?: number;
	answers: PlayerAnswerDetail[];
}>();

const summary = computed(() => {
	const answered = props.answers.filter((entry) => entry.timeMs !== null);
	const correct = props.answers.filter((entry) => entry.isCorrect).length;
	const totalMs = answered.reduce((sum, entry) => sum + (entry.timeMs ?? 0), 0);

	return {
		correct,
		accuracy: props.answers.length ? Math.round((correct / props.answers.length) * 100) : 0,
		avgSeconds: answered.length ? (totalMs / answered.length / 1000).toFixed(1) : '–',
		maxPoints: props.answers.reduce((sum, entry) => sum + entry.maxPoints, 0),
	};
});

const rankLabel = computed(() => {
	const { rank } = props.player;
	if (!rank) {
		return '–';
	}

	return props.playersCount ? t('report.rankOf', { rank, n: props.playersCount }) : t('report.rank', { rank });
});

const state = (entry: PlayerAnswerDetail): 'good' | 'bad' | 'none' => {
	if (entry.timeMs === null) {
		return 'none';
	}

	return entry.isCorrect ? 'good' : 'bad';
};

const timeRatio = (entry: PlayerAnswerDetail): number => {
	return Math.min(1, (entry.timeMs ?? 0) / (entry.timeLimit * 1000));
};
</script>

<template>
	<div class="report">
		<header class="hero">
			<span class="avatar" aria-hidden="true"><AvatarIcon :value="player.avatar" /></span>
			<div class="who">
				<strong class="name"><NameTag :name="player.nickname" :look="player.avatar" /></strong>
				<span class="rank"><AppIcon :name="MEDALS[(player.rank ?? 99) - 1] ?? 'medal'" /> {{ rankLabel }}</span>
			</div>
			<div class="score">
				<span class="score-value">{{ player.score }}</span>
				<span class="muted">/ {{ t('common.pts', { n: summary.maxPoints }) }}</span>
			</div>
		</header>

		<div class="tiles">
			<div class="tile" style="--tile-color: var(--color-4)">
				<span class="tile-value">{{ summary.correct }}/{{ answers.length }}</span>
				<span class="tile-label">{{ t('report.correct') }}</span>
			</div>
			<div class="tile" style="--tile-color: var(--color-2)">
				<span class="tile-value">{{ summary.accuracy }}%</span>
				<span class="tile-label">{{ t('report.accuracy') }}</span>
			</div>
			<div class="tile" style="--tile-color: var(--color-3)">
				<span class="tile-value">{{ t('report.seconds', { n: summary.avgSeconds }) }}</span>
				<span class="tile-label">{{ t('report.avgTime') }}</span>
			</div>
		</div>

		<div class="strip" role="img" :aria-label="t('report.timeline')">
			<span
				v-for="(entry, index) in answers"
				:key="index"
				class="segment"
				:class="state(entry)"
				:title="`${index + 1}. ${entry.question}`"
			></span>
		</div>

		<ol class="list selectable">
			<li v-for="(entry, index) in answers" :key="index" class="item" :class="state(entry)">
				<span class="number">{{ index + 1 }}</span>
				<div class="content">
					<strong class="question">{{ entry.question }}</strong>
					<span class="line">
						<AppIcon class="mark" :name="entry.isCorrect ? 'check' : 'cross'" />
						{{ t('report.yourAnswer') }} <em>{{ entry.answer ?? t('common.noAnswer') }}</em>
					</span>
					<span v-if="!entry.isCorrect" class="line muted">
						{{ t('report.correctAnswer') }} <em>{{ entry.correctAnswer }}</em>
					</span>
					<span v-if="entry.timeMs !== null" class="time">
						<span class="bar"><span class="fill" :style="{ width: `${timeRatio(entry) * 100}%` }"></span></span>
						<span class="muted">{{ t('report.seconds', { n: (entry.timeMs / 1000).toFixed(1) }) }} / {{ t('report.seconds', { n: entry.timeLimit }) }}</span>
					</span>
				</div>
				<span class="points">
					+{{ entry.points }}
					<span class="muted">/ {{ entry.maxPoints }}</span>
				</span>
			</li>
		</ol>
	</div>
</template>

<style scoped>
.report {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.hero {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem 1rem;
	padding: 1rem;
	border-radius: var(--radius);
	background: linear-gradient(135deg, color-mix(in srgb, var(--color-2) 22%, var(--surface-2)), color-mix(in srgb, var(--color-4) 18%, var(--surface-2)));
}

.avatar {
	display: grid;
	place-items: center;
	width: 3.5rem;
	height: 3.5rem;
	border-radius: 50%;
	background: var(--surface);
	box-shadow: 0 0.25rem 0 color-mix(in srgb, var(--surface) 55%, black);
	font-size: 2rem;
}

.who {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 8rem;
}

.name {
	font-size: 1.3rem;
	overflow-wrap: anywhere;
}

.rank {
	color: var(--text-muted);
	font-weight: 600;
}

.score {
	display: flex;
	align-items: baseline;
	gap: 0.35rem;
}

.score-value {
	color: var(--success);
	font-size: 2rem;
	font-weight: 700;
	line-height: 1;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.6rem;
}

.tile {
	display: flex;
	flex-direction: column;
	padding: 0.6rem 0.8rem;
	border-top: 0.25rem solid var(--tile-color);
	border-radius: var(--radius-sm);
	background: var(--surface-2);
}

.tile-value {
	font-size: 1.4rem;
	font-weight: 700;
}

.tile-label {
	color: var(--text-muted);
	font-size: 0.85rem;
	line-height: 1.2;
}

@media (max-width: 480px) {
	.tile {
		padding: 0.5rem 0.6rem;
	}

	.tile-value {
		font-size: 1.15rem;
	}

	.tile-label {
		font-size: 0.75rem;
	}
}

.strip {
	display: flex;
	gap: 0.2rem;
	height: 0.6rem;
}

.segment {
	flex: 1;
	border-radius: 999px;
	background: var(--border);
}

.segment.good {
	background: var(--success);
}

.segment.bad {
	background: var(--danger);
}

.list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.item {
	--state-color: var(--text-muted);
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem 0.9rem;
	border-radius: var(--radius-sm);
	background: var(--surface-2);
}

.item.good {
	--state-color: var(--success);
}

.item.bad {
	--state-color: var(--danger);
}

.number {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: var(--state-color);
	color: var(--on-color);
	font-weight: 700;
}

.content {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.15rem;
	min-width: 0;
}

.question {
	overflow-wrap: anywhere;
}

.line em {
	font-style: normal;
	font-weight: 600;
}

.mark {
	color: var(--state-color);
	font-weight: 700;
}

.time {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.2rem;
	font-size: 0.8rem;
}

.bar {
	flex: 1;
	max-width: 8rem;
	height: 0.35rem;
	overflow: hidden;
	border-radius: 999px;
	background: var(--border);
}

.fill {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: var(--color-3);
}

.points {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	color: var(--state-color);
	font-weight: 700;
	white-space: nowrap;
}

.points .muted {
	font-size: 0.8rem;
	font-weight: 500;
}
</style>
