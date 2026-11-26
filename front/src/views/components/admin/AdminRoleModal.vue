<script setup lang="ts">
// Create (role null) or edit a role: name, icon, colour and the plan limits it overrides.
import { reactive, ref, watch } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import RoleBadge from '@/views/components/utils/badge/RoleBadge.vue';
import type { AdminRole } from '@/interfaces/Admin/AdminInterface';
import type { AdminSection, PlanLimits, UserRole } from '@/interfaces/User/UserInterface';
import type { MessageKey } from '@/locales/en';
import { ADMIN_SECTIONS, ROLE_ICONS, ROLE_LIMITS } from '@/utils/Roles';
import { api } from '@/utils/API';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';

// Mirrors MAX_LIMIT in server user/roles.ts.
const MAX_LIMIT = 10000;

const props = defineProps<{ open: boolean; role: AdminRole | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const form = reactive({ name: '', icon: 'star', color: '#ffa07a' });
// Empty field = the role keeps the plan value.
const limits = reactive<Record<keyof PlanLimits, number | ''>>({ maxQuizzes: '', maxQuestions: '', maxPlayers: '' });
const admin = ref<AdminSection[]>([]);
const saving = ref(false);

watch(() => props.open, (open) => {
	if (!open) {
		return;
	}
	Object.assign(form, props.role ? { name: props.role.name, icon: props.role.icon, color: props.role.color } : { name: '', icon: 'star', color: '#ffa07a' });
	for (const key of ROLE_LIMITS) {
		limits[key] = props.role?.limits[key] ?? '';
	}
	admin.value = [...props.role?.admin ?? []];
});

const draft = (): UserRole => ({
	...form,
	limits: Object.fromEntries(ROLE_LIMITS.filter((key) => limits[key] !== '').map((key) => [key, limits[key]])),
	admin: admin.value,
});

const save = async (): Promise<void> => {
	saving.value = true;
	try {
		await api(props.role ? `/admin/roles/${props.role.id}` : '/admin/roles', props.role ? 'PUT' : 'POST', draft());
		toast.success(t('admin.roles.saved', { name: form.name.trim() }));
		emit('saved');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<BaseModal :open="open" :title="t(role ? 'admin.roles.edit' : 'admin.roles.new')" wide @close="emit('close')">
		<form id="role-form" class="form" @submit.prevent="save">
			<div class="row">
				<label class="field grow">
					<span>{{ t('admin.roles.name') }}</span>
					<input v-model="form.name" required maxlength="24" />
				</label>
				<label class="field">
					<span>{{ t('admin.roles.color') }}</span>
					<input v-model="form.color" type="color" class="color" />
				</label>
				<div class="field">
					<span>{{ t('admin.roles.preview') }}</span>
					<RoleBadge :role="{ ...draft(), name: form.name.trim() || t('admin.roles.name') }" />
				</div>
			</div>

			<fieldset class="field">
				<legend>{{ t('admin.roles.icon') }}</legend>
				<div class="icons" role="radiogroup">
					<label v-for="icon in ROLE_ICONS" :key="icon" class="icon" :class="{ active: form.icon === icon }">
						<input v-model="form.icon" type="radio" name="role-icon" :value="icon" :aria-label="icon" />
						<AppIcon :name="icon" />
					</label>
				</div>
			</fieldset>

			<fieldset class="field">
				<legend>{{ t('admin.roles.permissions') }}</legend>
				<p class="muted">{{ t('admin.roles.permissionsHint') }}</p>
				<div class="limits">
					<label v-for="key in ROLE_LIMITS" :key="key" class="field">
						<span>{{ t(`roles.limit.${key}` as MessageKey) }}</span>
						<input v-model="limits[key]" type="number" min="1" :max="MAX_LIMIT" step="1" :placeholder="t('admin.roles.planValue')" />
					</label>
				</div>
			</fieldset>

			<fieldset class="field">
				<legend>{{ t('admin.roles.adminAccess') }}</legend>
				<p class="muted">{{ t('admin.roles.adminAccessHint') }}</p>
				<div class="sections">
					<label v-for="section in ADMIN_SECTIONS" :key="section.area" class="section" :class="{ active: admin.includes(section.area) }" :style="{ '--tint': section.tint }">
						<input v-model="admin" type="checkbox" :value="section.area" />
						<span class="section-icon"><AppIcon :name="section.icon" /></span>
						{{ t(section.label) }}
					</label>
				</div>
			</fieldset>
		</form>

		<template #actions>
			<BaseButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</BaseButton>
			<BaseButton type="submit" form="role-form" :loading="saving"><AppIcon name="save" /> {{ t('common.save') }}</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.form {
	display: grid;
	gap: 1.1rem;
}

.row {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	gap: 1rem;
}

.field {
	display: grid;
	gap: 0.35rem;
	min-width: 0;
	margin: 0;
	padding: 0;
	border: none;
	font-weight: 600;
}

.grow {
	flex: 1 1 12rem;
}

.color {
	width: 4rem;
	height: 2.6rem;
	padding: 0.2rem;
	cursor: pointer;
}

.icons {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(2.8rem, 1fr));
	gap: 0.35rem;
	max-height: 11rem;
	padding: 0.4rem;
	overflow-y: auto;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
}

.icon {
	display: grid;
	place-items: center;
	height: 2.6rem;
	border-radius: var(--radius-sm);
	font-size: 1.3rem;
	cursor: pointer;
	transition: background 0.15s, transform 0.15s;
}

.icon:hover {
	background: var(--surface-2);
	transform: scale(1.1);
}

.icon.active {
	background: color-mix(in srgb, var(--accent) 18%, transparent);
	box-shadow: inset 0 0 0 2px var(--accent-line);
}

.icon:has(input:focus-visible) {
	box-shadow: 0 0 0 3px var(--focus-ring);
}

.icon input {
	position: absolute;
	opacity: 0;
	pointer-events: none;
}

.limits {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	gap: 0.75rem;
}

.sections {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
	gap: 0.5rem;
}

.section {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.45rem 0.6rem;
	border: 2px solid var(--border);
	border-radius: var(--radius-sm);
	font-weight: 600;
	cursor: pointer;
	transition: border-color 0.15s, background 0.15s;
}

.section:hover {
	border-color: var(--accent-line);
}

.section.active {
	border-color: var(--accent-line);
	background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.section:has(input:focus-visible) {
	box-shadow: 0 0 0 3px var(--focus-ring);
}

.section input {
	accent-color: var(--accent);
}

.section-icon {
	display: grid;
	place-items: center;
	width: 1.8rem;
	height: 1.8rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 22%, transparent);
}

.muted {
	margin: 0;
	color: var(--text-muted);
	font-weight: 400;
}
</style>
