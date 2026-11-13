<script setup lang="ts">
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import type { PlayHistoryEntry } from '@/interfaces/User/UserInterface';
import { locale, t } from '@/i18n';

defineProps<{ history: PlayHistoryEntry[] }>();
const emit = defineEmits<{ show: [entry: PlayHistoryEntry] }>();
</script>

<template>
	<BaseCard accent="var(--color-2)">
		<h2>{{ t('profile.myGames') }}</h2>
		<p v-if="!history.length" class="muted">{{ t('profile.noGames') }}</p>
		<ul class="history">
			<li v-for="entry in history" :key="entry.playerId">
				<button type="button" class="game" @click="emit('show', entry)">
					<span class="avatar" aria-hidden="true"><AvatarIcon :value="entry.avatar" /></span>
					<span class="info">
						<strong>{{ entry.quizTitle }}</strong>
						<span class="muted">{{ new Date(entry.playedAt).toLocaleDateString(locale) }}</span>
					</span>
					<span class="score">
						{{ t('common.pts', { n: entry.score }) }}
						<span class="muted">{{ entry.rank ? `#${entry.rank}` : '–' }} / {{ entry.playersCount }}</span>
					</span>
				</button>
			</li>
		</ul>
	</BaseCard>
</template>

<style scoped>
.history {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.game {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.6rem 0.9rem;
	border: none;
	border-radius: var(--radius-sm);
	background: var(--surface-2);
	text-align: left;
	cursor: pointer;
	transition: padding-left 0.15s, box-shadow 0.15s;
}

/* Content shifts inside the row; the row itself stays in its box. */
.game:hover {
	padding-left: 1.15rem;
	box-shadow: inset 0.25rem 0 0 var(--color-2);
}

.game .avatar {
	font-size: 1.6rem;
}

.info,
.score {
	display: flex;
	flex-direction: column;
}

.info {
	flex: 1;
	min-width: 0;
}

.score {
	align-items: flex-end;
	font-weight: 700;
}
</style>
