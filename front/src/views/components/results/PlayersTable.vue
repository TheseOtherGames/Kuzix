<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import DataTable from '@/views/components/utils/table/DataTable.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import type { QuestionDraft, Run, RunPlayer } from '@/interfaces/Quiz/QuizInterface';
import type { PlayerRow } from '@/interfaces/Results/ResultsInterface';
import { t } from '@/i18n';

defineProps<{
	rows: PlayerRow[];
	questions: QuestionDraft[];
	// Across sessions, a column shows which session each player was in.
	showSession: boolean;
	label: (run: Run) => string;
}>();

const emit = defineEmits<{ show: [player: RunPlayer] }>();

const MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'];
</script>

<template>
	<BaseCard accent="var(--color-2)">
		<h2><AppIcon name="players" /> {{ t('results.playersTitle') }}</h2>
		<p class="muted">{{ t('results.clickHint') }}</p>
		<p v-if="!rows.length" class="muted">{{ t('common.noPlayers') }}</p>
		<DataTable v-else>
			<thead>
				<tr>
					<th class="num">{{ t('csv.rank') }}</th>
					<th>{{ t('csv.nickname') }}</th>
					<th v-if="showSession">{{ t('csv.game') }}</th>
					<th class="num">{{ t('csv.score') }}</th>
					<th class="num">{{ t('report.correct') }}</th>
					<th class="num">{{ t('report.accuracy') }}</th>
					<th class="num">{{ t('report.avgTime') }}</th>
					<th>{{ t('results.col.answers') }}</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.player.id" class="player-row" @click="emit('show', row.player)">
					<td class="num">
						<span class="rank"><AppIcon v-if="row.rank && MEDALS[row.rank - 1]" :name="MEDALS[row.rank - 1]" /> {{ row.rank ?? '–' }}</span>
					</td>
					<td>
						<button type="button" class="who link" @click.stop="emit('show', row.player)">
							<AvatarIcon :value="row.player.avatar" /><NameTag :name="row.player.nickname" :look="row.player.avatar" />
						</button>
					</td>
					<td v-if="showSession" class="muted nowrap">{{ label(row.run) }}</td>
					<td class="num strong">{{ row.player.score }}</td>
					<td class="num">{{ row.correct }}/{{ questions.length }}</td>
					<td class="num">{{ row.accuracy }}</td>
					<td class="num">{{ row.avgTime }}</td>
					<td>
						<span class="strip" role="img" :aria-label="t('report.timeline')">
							<span v-for="(mark, q) in row.strip" :key="q" class="segment" :class="mark" :title="`${q + 1}. ${questions[q]?.text}`"></span>
						</span>
					</td>
				</tr>
			</tbody>
		</DataTable>
	</BaseCard>
</template>

<style scoped>
h2 {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0 0 0.5rem;
}

.who {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	min-width: 0;
	font-size: 1.1rem;
}

.link {
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	cursor: pointer;
}

.link:hover {
	color: var(--accent-text);
}

.link:focus-visible {
	outline: 3px solid var(--focus-ring);
	outline-offset: 2px;
	border-radius: var(--radius-sm);
}

.strong {
	color: var(--success);
	font-weight: 700;
}

.player-row {
	cursor: pointer;
	transition: background 0.15s;
}

.player-row:hover {
	background: var(--surface-2);
}

.rank {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-weight: 700;
}

.strip {
	display: flex;
	gap: 0.15rem;
	min-width: 6rem;
	height: 0.55rem;
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
</style>
