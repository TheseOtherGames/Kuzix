<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AdminModerationModal, { type ModerationTarget } from '@/views/components/admin/AdminModerationModal.vue';
import AdminQuizTitle from '@/views/components/admin/AdminQuizTitle.vue';
import AdminUserModal from '@/views/components/admin/AdminUserModal.vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import type { AdminReport } from '@/interfaces/Admin/AdminInterface';
import { api } from '@/utils/API';
import { locale, t } from '@/i18n';
import { toast } from '@/utils/Toast';

// Mirrors LIST_LIMIT in server admin.service.ts.
const LIST_LIMIT = 200;

const status = ref<'open' | 'resolved'>('open');
const reports = ref<AdminReport[] | null>(null);
const openId = ref<number | null>(null);
const moderating = ref<ModerationTarget | null>(null);

const load = async (): Promise<void> => {
	try {
		reports.value = await api<AdminReport[]>(`/admin/reports?status=${status.value}`);
	} catch (error) {
		toast.error((error as Error).message);
	}
};

watch(status, () => {
	reports.value = null;
	load();
});
onMounted(load);

const dismiss = async (report: AdminReport): Promise<void> => {
	try {
		await api(`/admin/reports/${report.id}/dismiss`, 'POST');
		toast.success(t('admin.reports.dismissed'));
		await load();
	} catch (error) {
		toast.error((error as Error).message);
	}
};

const moderate = (report: AdminReport, kind: ModerationTarget['kind']): void => {
	moderating.value = { quiz: { id: report.quizId, title: report.quizTitle }, kind };
};

const formatDate = (value: string): string => new Date(value).toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'short' });
</script>

<template>
	<header class="admin-head">
		<div>
			<h1>{{ t('admin.reports.title') }}</h1>
			<p>{{ t('admin.reports.hint') }}</p>
		</div>
		<div class="status" role="group" :aria-label="t('admin.reports.title')">
			<BaseButton size="sm" :variant="status === 'open' ? 'primary' : 'ghost'" :aria-pressed="status === 'open'" @click="status = 'open'">{{ t('admin.reports.open') }}</BaseButton>
			<BaseButton size="sm" :variant="status === 'resolved' ? 'primary' : 'ghost'" :aria-pressed="status === 'resolved'" @click="status = 'resolved'">{{ t('admin.reports.resolved') }}</BaseButton>
		</div>
	</header>
	<div class="admin-panel">
		<p v-if="!reports" class="admin-empty">{{ t('common.loading') }}</p>
		<p v-else-if="!reports.length" class="admin-empty">{{ t(status === 'open' ? 'admin.reports.emptyOpen' : 'admin.reports.emptyResolved') }}</p>
		<div v-else class="table-scroll">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{{ t('admin.col.quiz') }}</th>
						<th>{{ t('admin.col.owner') }}</th>
						<th>{{ t('admin.reports.by') }}</th>
						<th>{{ t('admin.reports.reason') }}</th>
						<th v-if="status === 'open'" class="num">{{ t('admin.col.actions') }}</th>
						<th v-else>{{ t('admin.reports.resolvedBy') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="report in reports" :key="report.id">
						<td>
							<div class="quiz">
								<AdminQuizTitle class="title" :id="report.quizId" :title="report.quizTitle" />
								<span v-if="report.deleted" class="badge bad">{{ t('admin.status.deleted') }}</span>
								<span v-else-if="report.moderation" class="badge bad">{{ t(`admin.mod.${report.moderation}`) }}</span>
								<span v-else-if="!report.isPublic" class="badge">{{ t('admin.reports.private') }}</span>
							</div>
						</td>
						<td><button type="button" class="user" :aria-label="t('admin.openUser', { name: report.owner })" @click="openId = report.ownerId">{{ report.owner }}</button></td>
						<td>
							<button type="button" class="user" :aria-label="t('admin.openUser', { name: report.reporter })" @click="openId = report.reporterId">{{ report.reporter }}</button>
							<small class="date muted">{{ formatDate(report.createdAt) }}</small>
						</td>
						<td><p class="reason selectable">{{ report.reason }}</p></td>
						<td>
							<div v-if="status === 'open'" class="row-actions">
								<BaseButton variant="tool" @click="dismiss(report)"><AppIcon name="check" /> {{ t('admin.reports.dismiss') }}</BaseButton>
								<template v-if="!report.deleted">
									<BaseButton v-if="!report.moderation" variant="tool" @click="moderate(report, 'warned')"><AppIcon name="warning" /> {{ t('admin.mod.warn') }}</BaseButton>
									<BaseButton v-if="report.moderation !== 'banned'" variant="tool-danger" @click="moderate(report, 'banned')"><AppIcon name="ban" /> {{ t('admin.mod.ban') }}</BaseButton>
								</template>
							</div>
							<span v-else class="muted">{{ report.resolvedBy ?? '—' }} · {{ formatDate(report.resolvedAt!) }}</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<p v-if="reports?.length === LIST_LIMIT" class="muted capped">{{ t('admin.capped', { n: LIST_LIMIT }) }}</p>
	<AdminUserModal :user-id="openId" @close="openId = null" @changed="load" />
	<AdminModerationModal :target="moderating" @close="moderating = null" @done="moderating = null; load()" />
</template>

<style scoped>
.status {
	display: flex;
	gap: 0.35rem;
}

.quiz {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 600;
}

/* A block inside the cell: the shared table rule keeps cells on one line. */
.reason {
	min-width: 12rem;
	margin: 0;
	max-width: 22rem;
	white-space: pre-line;
	overflow-wrap: anywhere;
}

.user {
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

.user:hover {
	background: color-mix(in srgb, var(--accent) 16%, transparent);
	color: var(--accent-text);
}

.date {
	display: block;
	font-size: 0.8rem;
}

.capped {
	margin: 0.75rem 0 0;
	font-size: 0.85rem;
}
</style>
