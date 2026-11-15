<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import Notice from '@/views/components/utils/text/Notice.vue';
import type { QuizSummary } from '@/interfaces/Quiz/QuizInterface';
import { t, tp } from '@/i18n';

defineProps<{
	quiz: QuizSummary;
	accent: string;
	canDuplicate: boolean;
}>();

const emit = defineEmits<{
	open: [];
	close: [];
	share: [];
	duplicate: [];
	export: [];
	recode: [];
	delete: [];
	publish: [];
	pull: [];
}>();
</script>

<template>
	<BaseCard :accent="accent" class="quiz">
		<div class="title-row">
			<h2>{{ quiz.title }}</h2>
			<div class="badges">
				<span v-if="quiz.source?.updateAvailable" class="status outdated" :data-tip="t('dash.updateTitle')"><AppIcon name="refresh" /> {{ t('dash.statusOutdated') }}</span>
				<span v-if="quiz.isPublic" class="status public"><AppIcon name="globe" /> {{ t('dash.statusPublic') }}</span>
				<span class="status" :class="{ open: quiz.isOpen }">{{ quiz.isOpen ? t('dash.statusOpen') : t('dash.statusClosed') }}</span>
			</div>
		</div>
		<p v-if="quiz.source" class="origin muted">
			{{ t('dash.copyOf', { title: quiz.source.title, owner: quiz.source.owner }) }}
			<template v-if="!quiz.source.available"> · {{ t('dash.sourceGone') }}</template>
		</p>
		<div v-if="quiz.source?.updateAvailable" class="update">
			<span class="update-icon"><AppIcon name="sparkles" /></span>
			<span class="update-text">
				<strong>{{ t('dash.updateTitle') }}</strong>
				<span class="muted">{{ quiz.isOpen ? t('dash.updateWhenClosed') : t('dash.updateText') }}</span>
			</span>
			<BaseButton v-if="!quiz.isOpen" size="sm" variant="primary" @click="emit('pull')"><AppIcon name="refresh" /> {{ t('dash.pull') }}</BaseButton>
		</div>
		<Notice v-if="quiz.moderation" :icon="quiz.moderation === 'banned' ? 'ban' : 'warning'" class="moderation">
			<strong>{{ t(quiz.moderation === 'banned' ? 'dash.bannedNotice' : 'dash.warnedNotice') }}</strong>
			<span v-if="quiz.moderationReason" class="selectable"> {{ quiz.moderationReason }}</span>
		</Notice>
		<ul class="facts">
			<li><strong class="num">{{ quiz.questionsCount }}</strong><span>{{ tp('dash.questions', quiz.questionsCount) }}</span></li>
			<li><strong class="num">{{ quiz.runsCount }}</strong><span>{{ tp('dash.plays', quiz.runsCount) }}</span></li>
			<li v-if="quiz.code"><span>{{ t('dash.code') }}</span><strong class="num code selectable">{{ quiz.code }}</strong></li>
		</ul>

		<section class="section">
			<h3 class="section-title">{{ t('dash.sectionPlay') }}</h3>
			<div class="actions">
				<template v-if="quiz.isOpen">
					<BaseButton variant="success" :to="`/host/${quiz.uid}`"><AppIcon name="play" /> {{ t('dash.host') }}</BaseButton>
					<BaseButton variant="danger" @click="emit('close')"><AppIcon name="stop" /> {{ t('dash.close') }}</BaseButton>
				</template>
				<BaseButton v-else-if="quiz.moderation !== 'banned'" variant="success" @click="emit('open')"><AppIcon name="play" /> {{ quiz.runsCount ? t('dash.reopen') : t('dash.open') }}</BaseButton>
				<BaseButton v-if="quiz.code" variant="secondary" @click="emit('share')"><AppIcon name="link" /> {{ t('dash.share') }}</BaseButton>
				<BaseButton v-if="quiz.runsCount" variant="primary" :to="`/quizzes/${quiz.uid}/results`"><AppIcon name="chart" /> {{ t('dash.results') }}</BaseButton>
			</div>
		</section>

		<section class="section">
			<h3 class="section-title">{{ t('dash.sectionManage') }}</h3>
			<div class="actions">
				<BaseButton v-if="!quiz.isOpen" variant="tool" :to="`/quizzes/${quiz.uid}/edit`"><AppIcon name="pencil" />{{ t('dash.edit') }}</BaseButton>
				<BaseButton v-if="!quiz.source && quiz.moderation !== 'banned'" variant="tool" @click="emit('publish')">
					<AppIcon name="globe" />{{ quiz.isPublic ? t('dash.unpublish') : t('dash.publish') }}
				</BaseButton>
				<BaseButton v-if="canDuplicate" variant="tool" @click="emit('duplicate')"><AppIcon name="page" />{{ t('dash.duplicate') }}</BaseButton>
				<BaseButton variant="tool" @click="emit('export')"><AppIcon name="download" />{{ t('dash.export') }}</BaseButton>
				<BaseButton v-if="quiz.code" variant="tool" @click="emit('recode')"><AppIcon name="refresh" />{{ t('dash.newCode') }}</BaseButton>
				<BaseButton variant="tool-danger" @click="emit('delete')"><AppIcon name="trash" />{{ t('dash.delete') }}</BaseButton>
			</div>
		</section>
	</BaseCard>
</template>

<style scoped>
.quiz {
	display: flex;
	flex-direction: column;
}

.title-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}

.title-row h2 {
	overflow-wrap: anywhere;
}

.status {
	padding: 0.15rem 0.7rem;
	border-radius: 999px;
	background: var(--surface-2);
	color: var(--text-muted);
	font-size: 0.85rem;
	font-weight: 600;
}

.status.open {
	background: var(--btn-success);
	color: var(--on-color);
}

.badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.35rem;
	white-space: nowrap;
}

.status.public {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	background: color-mix(in srgb, var(--accent) 25%, var(--surface));
	color: var(--text);
}

.status.outdated {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	background: color-mix(in srgb, var(--color-3) 35%, var(--surface));
	color: var(--text);
}

.update {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.6rem;
	margin: 0 0 0.75rem;
	padding: 0.6rem 0.75rem;
	border: 2px solid var(--accent-line);
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}

.update-icon {
	display: inline-grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--accent) 30%, var(--surface));
	font-size: 1.2rem;
}

.update-text {
	display: grid;
	flex: 1 1 10rem;
	gap: 0.1rem;
	font-size: 0.9rem;
}

.origin {
	margin: -0.25rem 0 0.75rem;
	font-size: 0.9rem;
	overflow-wrap: anywhere;
}

.moderation {
	margin: 0 0 0.75rem;
}

.facts {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: auto 0 1rem;
	padding: 0;
	list-style: none;
	color: var(--text-muted);
	font-size: 0.9rem;
}

.facts li {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.2rem 0.7rem 0.2rem 0.2rem;
	border-radius: 999px;
	background: var(--surface-2);
}

/* Label first (code pill): mirror the padding so the label isn't pushed off-centre. */
.facts li:has(> span:first-child) {
	padding: 0.2rem 0.2rem 0.2rem 0.7rem;
}

.num {
	min-width: 1.7rem;
	padding: 0.05rem 0.5rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--accent) 30%, var(--surface));
	color: var(--text);
	text-align: center;
}

.code {
	font-family: var(--font-mono);
	letter-spacing: 0.05em;
}

.section {
	padding-top: 0.75rem;
	border-top: 1px dashed var(--border);
}

.section + .section {
	margin-top: 0.75rem;
}

.section-title {
	margin: 0 0 0.5rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* Whole buttons wrap to the next row; their label never does. */
.actions > * {
	flex: 1 1 auto;
}
</style>
