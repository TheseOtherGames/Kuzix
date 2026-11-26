<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import AdminQuizTitle from '@/views/components/admin/AdminQuizTitle.vue';
import AdminUserModal from '@/views/components/admin/AdminUserModal.vue';
import AdminModerationModal, { type ModerationTarget } from '@/views/components/admin/AdminModerationModal.vue';
import type { AdminQuiz } from '@/interfaces/Admin/AdminInterface';
import { api } from '@/utils/API';
import { locale, t } from '@/i18n';
import { toast } from '@/utils/Toast';

// Mirrors LIST_LIMIT in server admin.service.ts.
const LIST_LIMIT = 200;

const quizzes = ref<AdminQuiz[] | null>(null);
const search = ref('');
const openId = ref<number | null>(null);
const moderating = ref<ModerationTarget | null>(null);

const load = async (): Promise<void> => {
	try {
		quizzes.value = await api<AdminQuiz[]>(`/admin/quizzes?q=${encodeURIComponent(search.value)}`);
	} catch (error) {
		toast.error((error as Error).message);
	}
};

let timer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
	clearTimeout(timer);
	timer = setTimeout(load, 250);
});
onMounted(load);
</script>

<template>
	<header class="admin-head">
		<div>
			<h1>{{ t('admin.quizzes') }}</h1>
			<p>{{ t('admin.quizzesHint') }}</p>
		</div>
		<input v-model="search" type="search" class="admin-search" :placeholder="t('admin.searchQuizzes')" :aria-label="t('admin.search')" />
	</header>
	<div class="admin-panel">
		<p v-if="!quizzes" class="admin-empty">{{ t('common.loading') }}</p>
		<p v-else-if="!quizzes.length" class="admin-empty">{{ t('admin.empty') }}</p>
		<div v-else class="table-scroll">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{{ t('admin.col.quiz') }}</th>
						<th>{{ t('admin.col.owner') }}</th>
						<th>{{ t('admin.col.code') }}</th>
						<th class="num">{{ t('admin.col.questions') }}</th>
						<th class="num">{{ t('admin.col.sessions') }}</th>
						<th>{{ t('admin.col.status') }}</th>
						<th>{{ t('admin.col.moderation') }}</th>
						<th>{{ t('admin.col.created') }}</th>
						<th class="num">{{ t('admin.col.actions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="quiz in quizzes" :key="quiz.id" :class="{ deleted: quiz.deleted }">
						<td class="title"><AdminQuizTitle :id="quiz.id" :title="quiz.title" /></td>
						<td>
							<button type="button" class="owner" :aria-label="t('admin.openUser', { name: quiz.owner })" @click="openId = quiz.ownerId">{{ quiz.owner }}</button>
						</td>
						<td class="code selectable">{{ quiz.code ?? '—' }}</td>
						<td class="num">{{ quiz.questions }}</td>
						<td class="num">{{ quiz.runs }}</td>
						<td>
							<span v-if="quiz.deleted" class="badge bad">{{ t('admin.status.deleted') }}</span>
							<span v-else-if="quiz.isOpen" class="badge good">{{ t('admin.status.open') }}</span>
							<span v-else class="badge">{{ t('admin.status.idle') }}</span>
							<span v-if="quiz.isPublic" class="badge accent">{{ t('admin.status.public') }}</span>
						</td>
						<td>
							<span v-if="quiz.moderation" class="badge bad" :data-tip="quiz.moderationReason ?? undefined">{{ t(`admin.mod.${quiz.moderation}`) }}</span>
							<span v-else class="muted">—</span>
						</td>
						<td class="muted">{{ new Date(quiz.createdAt).toLocaleDateString(locale) }}</td>
						<td>
							<div v-if="!quiz.deleted" class="row-actions">
								<BaseButton v-if="quiz.moderation" variant="tool" @click="moderating = { quiz, kind: null }"><AppIcon name="undo" /> {{ t('admin.mod.clear') }}</BaseButton>
								<BaseButton v-if="!quiz.moderation" variant="tool" @click="moderating = { quiz, kind: 'warned' }"><AppIcon name="warning" /> {{ t('admin.mod.warn') }}</BaseButton>
								<BaseButton v-if="quiz.moderation !== 'banned'" variant="tool-danger" @click="moderating = { quiz, kind: 'banned' }"><AppIcon name="ban" /> {{ t('admin.mod.ban') }}</BaseButton>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<p v-if="quizzes?.length === LIST_LIMIT" class="muted capped">{{ t('admin.capped', { n: LIST_LIMIT }) }}</p>
	<AdminUserModal :user-id="openId" @close="openId = null" @changed="load" />
	<AdminModerationModal :target="moderating" @close="moderating = null" @done="moderating = null; load()" />
</template>

<style scoped>
.title {
	max-width: 20rem;
	overflow: hidden;
	font-weight: 600;
	text-overflow: ellipsis;
}

.owner {
	padding: 0.15rem 0.45rem;
	margin-left: -0.45rem;
	border: none;
	border-radius: 0.45rem;
	background: none;
	color: var(--text-muted);
	font: inherit;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.owner:hover {
	background: color-mix(in srgb, var(--accent) 16%, transparent);
	color: var(--accent-text);
}

.deleted .title {
	color: var(--text-muted);
	text-decoration: line-through;
}

.capped {
	margin: 0.75rem 0 0;
	font-size: 0.85rem;
}
</style>
