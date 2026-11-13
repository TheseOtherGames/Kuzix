<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AdminUserModal from './AdminUserModal.vue';
import type { AdminQuiz } from './admin.types';
import { api } from '../../shared/api';
import { locale, t } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';

// Mirrors LIST_LIMIT in server admin.service.ts.
const LIST_LIMIT = 200;

const quizzes = ref<AdminQuiz[] | null>(null);
const search = ref('');
const openId = ref<number | null>(null);

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
						<th>{{ t('admin.col.created') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="quiz in quizzes" :key="quiz.id" :class="{ deleted: quiz.deleted }">
						<td class="title">{{ quiz.title }}</td>
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
						</td>
						<td class="muted">{{ new Date(quiz.createdAt).toLocaleDateString(locale) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<p v-if="quizzes?.length === LIST_LIMIT" class="muted capped">{{ t('admin.capped', { n: LIST_LIMIT }) }}</p>
	<AdminUserModal :user-id="openId" @close="openId = null" @changed="load" />
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
