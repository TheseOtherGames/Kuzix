<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import AdminUserModal from '@/views/components/admin/AdminUserModal.vue';
import type { AdminUser } from '@/interfaces/Admin/AdminInterface';
import { api } from '@/utils/API';
import { locale, t } from '@/i18n';
import { toast } from '@/utils/Toast';
import { auth } from '@/utils/Auth';

// Mirrors LIST_LIMIT in server admin.service.ts.
const LIST_LIMIT = 200;

const users = ref<AdminUser[] | null>(null);
const search = ref('');
const openId = ref<number | null>(null);

const load = async (): Promise<void> => {
	try {
		users.value = await api<AdminUser[]>(`/admin/users?q=${encodeURIComponent(search.value)}`);
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
			<h1>{{ t('admin.users') }}</h1>
			<p>{{ t('admin.usersHint') }}</p>
		</div>
		<input v-model="search" type="search" class="admin-search" :placeholder="t('admin.searchUsers')" :aria-label="t('admin.search')" />
	</header>
	<div class="admin-panel">
		<p v-if="!users" class="admin-empty">{{ t('common.loading') }}</p>
		<p v-else-if="!users.length" class="admin-empty">{{ t('admin.empty') }}</p>
		<div v-else class="table-scroll">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{{ t('admin.col.user') }}</th>
						<th>{{ t('admin.col.email') }}</th>
						<th>{{ t('admin.col.plan') }}</th>
						<th class="num">{{ t('admin.col.quizzes') }}</th>
						<th class="num">{{ t('admin.col.games') }}</th>
						<th>{{ t('admin.col.joined') }}</th>
						<th>{{ t('admin.col.role') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="user in users" :key="user.id" :class="{ banned: user.bannedAt }">
						<td>
							<button type="button" class="who" :aria-label="t('admin.openUser', { name: user.username })" @click="openId = user.id">
								<AvatarIcon :value="user.avatar" /> {{ user.username }}
							</button>
						</td>
						<td class="muted selectable">{{ user.email ?? '—' }}</td>
						<td><span class="badge">{{ user.plan }}</span></td>
						<td class="num">{{ user.quizzes }}</td>
						<td class="num">{{ user.gamesPlayed }}</td>
						<td class="muted">{{ new Date(user.createdAt).toLocaleDateString(locale) }}</td>
						<td>
							<span class="role">
								<span v-if="user.bannedAt" class="badge bad">{{ t('admin.status.banned') }}</span>
								<span class="badge" :class="{ accent: user.isAdmin }">{{ t(user.isAdmin ? 'admin.role.admin' : 'admin.role.user') }}</span>
								<span v-if="user.id === auth.user?.id" class="muted">{{ t('admin.you') }}</span>
							</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<p v-if="users?.length === LIST_LIMIT" class="muted capped">{{ t('admin.capped', { n: LIST_LIMIT }) }}</p>

	<AdminUserModal :user-id="openId" @close="openId = null" @changed="load" />
</template>

<style scoped>
.who {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.2rem 0.5rem 0.2rem 0.25rem;
	margin-left: -0.25rem;
	border: none;
	border-radius: 0.45rem;
	background: none;
	color: var(--text);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.who:hover {
	background: color-mix(in srgb, var(--accent) 16%, transparent);
	color: var(--accent-text);
}

.banned .who {
	color: var(--text-muted);
	text-decoration: line-through;
}

.who :deep(svg) {
	font-size: 1.4rem;
}

.role {
	display: inline-flex;
	align-items: center;
	gap: 0.6rem;
}

.capped {
	margin: 0.75rem 0 0;
	font-size: 0.85rem;
}
</style>
