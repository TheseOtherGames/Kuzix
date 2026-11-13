<script setup lang="ts">
import NameTag from '@/shared/ui/NameTag.vue';
import AppIcon from '@/shared/ui/AppIcon.vue';
import AvatarIcon from '@/shared/ui/AvatarIcon.vue';
import { t } from '@/shared/i18n/i18n';
import { computed } from 'vue';

export interface LeaderboardEntry {
	id: number;
	nickname: string;
	avatar: string;
	score: number;
	rank: number | null;
}

const props = defineProps<{
	entries: LeaderboardEntry[];
	limit?: number;
	highlightId?: number;
	selectable?: boolean;
}>();

const emit = defineEmits<{ select: [entry: LeaderboardEntry] }>();

const MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'];
const RANK_COLORS = ['var(--color-3)', 'var(--color-2)', 'var(--color-6)'];

const visible = computed(() => props.entries.slice(0, props.limit ?? props.entries.length));
</script>

<template>
	<ol class="leaderboard">
		<li v-for="entry in visible" :key="entry.id">
			<component
				:is="selectable ? 'button' : 'div'"
				:type="selectable ? 'button' : undefined"
				class="row"
				:class="{ highlight: entry.id === highlightId, clickable: selectable }"
				:style="{ '--rank-color': RANK_COLORS[(entry.rank ?? 99) - 1] ?? 'var(--surface-2)' }"
				@click="selectable && emit('select', entry)"
			>
				<span class="rank"><AppIcon v-if="MEDALS[(entry.rank ?? 99) - 1]" :name="MEDALS[(entry.rank ?? 99) - 1]" /><template v-else>{{ entry.rank ?? '–' }}</template></span>
				<span class="avatar" aria-hidden="true"><AvatarIcon :value="entry.avatar" /></span>
				<span class="name"><NameTag :name="entry.nickname" :look="entry.avatar" /></span>
				<span class="score">{{ entry.score }}</span>
			</component>
		</li>
		<li v-if="!entries.length" class="muted">{{ t('common.noPlayers') }}</li>
	</ol>
</template>

<style scoped>
.leaderboard {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.row {
	display: flex;
	width: 100%;
	border: none;
	text-align: left;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	border-left: 0.4rem solid var(--rank-color);
	border-radius: var(--radius-sm);
	background: var(--surface-2);
	animation: slide-in 0.4s ease-out backwards;
}

.clickable {
	cursor: pointer;
}

.clickable:hover {
	filter: brightness(1.1);
}

li:nth-child(2) .row {
	animation-delay: 0.08s;
}

li:nth-child(3) .row {
	animation-delay: 0.16s;
}

.highlight {
	outline: 2px solid var(--color-3);
}

.rank {
	min-width: 2rem;
	font-size: 1.2rem;
	font-weight: 700;
	text-align: center;
}

.avatar {
	font-size: 1.5rem;
}

/* No overflow: hidden here: it would clip the tag's tilt, shadow and animations.
   min-width: 0 lets the cell shrink; NameTag ellipsizes its own text. */
.name {
	flex: 1;
	min-width: 0;
	padding-block: 0.2em;
	font-weight: 600;
}

.score {
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

@keyframes slide-in {
	from {
		opacity: 0;
		clip-path: inset(0 100% 0 0 round var(--radius-sm));
	}

	to {
		clip-path: inset(0 0 0 0 round var(--radius-sm));
	}
}
</style>
