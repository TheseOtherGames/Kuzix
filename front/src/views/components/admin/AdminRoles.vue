<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import RoleBadge from '@/views/components/utils/badge/RoleBadge.vue';
import AdminRoleModal from '@/views/components/admin/AdminRoleModal.vue';
import type { AdminRole } from '@/interfaces/Admin/AdminInterface';
import { rolePerks } from '@/utils/Roles';
import { api } from '@/utils/API';
import { t, tp } from '@/i18n';
import { toast } from '@/utils/Toast';

const roles = ref<AdminRole[] | null>(null);
// null = closed, 'new' = create, a role = edit it.
const editing = ref<AdminRole | 'new' | null>(null);
const deleting = ref<AdminRole | null>(null);
const removing = ref(false);

const load = async (): Promise<void> => {
	try {
		roles.value = await api<AdminRole[]>('/admin/roles');
	} catch (error) {
		toast.error((error as Error).message);
	}
};

const saved = (): void => {
	editing.value = null;
	load();
};

const remove = async (): Promise<void> => {
	const role = deleting.value!;
	removing.value = true;
	try {
		await api(`/admin/roles/${role.id}`, 'DELETE');
		toast.success(t('admin.roles.deleted', { name: role.name }));
		deleting.value = null;
		await load();
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		removing.value = false;
	}
};

onMounted(load);
</script>

<template>
	<header class="admin-head">
		<div>
			<h1>{{ t('admin.roles.title') }}</h1>
			<p>{{ t('admin.roles.hint') }}</p>
		</div>
		<BaseButton @click="editing = 'new'"><AppIcon name="plus" /> {{ t('admin.roles.new') }}</BaseButton>
	</header>
	<div class="admin-panel">
		<p v-if="!roles" class="admin-empty">{{ t('common.loading') }}</p>
		<p v-else-if="!roles.length" class="admin-empty">{{ t('admin.roles.empty') }}</p>
		<div v-else class="table-scroll">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{{ t('admin.roles.name') }}</th>
						<th>{{ t('admin.roles.permissions') }}</th>
						<th class="num">{{ t('admin.users') }}</th>
						<th class="num">{{ t('admin.roles.actions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="role in roles" :key="role.id">
						<td><RoleBadge :role="role" /></td>
						<td>
							<ul v-if="rolePerks(role).length" class="perks">
								<li v-for="perk in rolePerks(role)" :key="perk.key"><AppIcon :name="perk.icon" />{{ perk.text }}</li>
							</ul>
							<p v-else class="muted no-perk">{{ t('roles.noPerk') }}</p>
						</td>
						<td class="num">{{ role.users }}</td>
						<td>
							<div class="row-actions">
								<BaseButton variant="tool" @click="editing = role"><AppIcon name="pencil" /> {{ t('admin.roles.editShort') }}</BaseButton>
								<BaseButton variant="tool-danger" :data-tip="tp('admin.roles.deleteTip', role.users)" @click="deleting = role"><AppIcon name="trash" /> {{ t('admin.roles.delete') }}</BaseButton>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<AdminRoleModal :open="editing !== null" :role="editing === 'new' ? null : editing" @close="editing = null" @saved="saved" />

	<ConfirmModal :open="Boolean(deleting)" :title="t('admin.roles.deleteTitle', { name: deleting?.name ?? '' })" :confirm-label="t('admin.roles.delete')" icon="trash" :loading="removing" @close="deleting = null" @confirm="remove">
		<p>{{ tp('admin.roles.deleteText', deleting?.users ?? 0) }}</p>
	</ConfirmModal>
</template>

<style scoped>
.perks {
	display: grid;
	gap: 0.3rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.perks li {
	display: flex;
	align-items: center;
	gap: 0.45rem;
}

.no-perk {
	margin: 0;
}

/* A <div> inside the cell: flex on the <td> itself would break the table row. */
.row-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.4rem;
}
</style>
