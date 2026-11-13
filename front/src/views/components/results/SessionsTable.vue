<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import DataTable from '@/views/components/utils/table/DataTable.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import type { Run } from '@/interfaces/Quiz/QuizInterface';
import type { SessionSummary } from '@/interfaces/Results/ResultsInterface';
import { t } from '@/i18n';

defineProps<{
	sessions: SessionSummary[];
	label: (run: Run) => string;
}>();

const emit = defineEmits<{ pick: [run: Run]; exportStats: [run: Run]; exportAnswers: [run: Run]; clear: [run: Run] }>();
</script>

<template>
	<BaseCard accent="var(--color-1)">
		<h2><AppIcon name="play" /> {{ t('results.sessions') }}</h2>
		<DataTable>
			<thead>
				<tr>
					<th>{{ t('csv.started') }}</th>
					<th>{{ t('results.col.status') }}</th>
					<th class="num">{{ t('results.stat.players') }}</th>
					<th class="num">{{ t('results.col.avgScore') }}</th>
					<th>{{ t('results.col.winner') }}</th>
					<th><span class="sr-only">{{ t('results.col.actions') }}</span></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="session in sessions" :key="session.run.id">
					<td class="nowrap"><button type="button" class="link" @click="emit('pick', session.run)">{{ label(session.run) }}</button></td>
					<td>{{ session.run.endedAt ? t('results.finished') : t('results.inProgress') }}</td>
					<td class="num">{{ session.run.players.length }}</td>
					<td class="num">{{ session.avg }}</td>
					<td>
						<span v-if="session.best" class="who"><AvatarIcon :value="session.best.avatar" /><NameTag :name="session.best.nickname" :look="session.best.avatar" /></span>
						<span v-else class="muted">–</span>
					</td>
					<td class="row-actions">
						<BaseButton v-if="session.run.players.length" variant="tool" :aria-label="t('results.exportRun')" @click="emit('exportStats', session.run)"><AppIcon name="download" /></BaseButton>
						<BaseButton v-if="session.run.players.length" variant="tool" :aria-label="t('results.exportAnswers')" @click="emit('exportAnswers', session.run)"><AppIcon name="page" /></BaseButton>
						<BaseButton v-if="session.run.endedAt" variant="tool-danger" :aria-label="t('results.clearRun')" @click="emit('clear', session.run)"><AppIcon name="trash" /></BaseButton>
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

.row-actions {
	white-space: nowrap;
}

.row-actions > * + * {
	margin-left: 0.35rem;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
}
</style>
