<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AvatarIcon from '../../shared/ui/AvatarIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import NameTag from '../../shared/ui/NameTag.vue';
import type { AdminUserDetail } from './admin.types';
import { api } from '../../shared/api';
import { locale, t, tp } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';
import { auth } from '../auth/auth.store';

const props = defineProps<{ userId: number | null }>();
const emit = defineEmits<{ close: []; changed: [] }>();

type Action = 'grant' | 'revoke' | 'ban' | 'unban';

const user = ref<AdminUserDetail | null>(null);
const confirming = ref<Action | null>(null);
const reason = ref('');
const saving = ref(false);

const isSelf = computed(() => user.value?.id === auth.user?.id);
const formatDate = (iso: string): string => new Date(iso).toLocaleDateString(locale.value);

const load = async (id: number): Promise<void> => {
	try {
		user.value = await api<AdminUserDetail>(`/admin/users/${id}`);
	} catch (error) {
		toast.error((error as Error).message);
		emit('close');
	}
};

watch(() => props.userId, (id) => {
	user.value = null;
	confirming.value = null;
	reason.value = '';
	if (id) {
		load(id);
	}
}, { immediate: true });

const CONFIRM: Record<Action, { title: Parameters<typeof t>[0]; text: Parameters<typeof t>[0]; button: Parameters<typeof t>[0]; variant: 'primary' | 'danger' | 'success' }> = {
	grant: {
		title: 'admin.grantTitle', text: 'admin.grantText', button: 'admin.makeAdmin', variant: 'primary',
	},
	revoke: {
		title: 'admin.revokeTitle', text: 'admin.revokeText', button: 'admin.removeAdmin', variant: 'danger',
	},
	ban: {
		title: 'admin.banTitle', text: 'admin.banText', button: 'admin.ban', variant: 'danger',
	},
	unban: {
		title: 'admin.unbanTitle', text: 'admin.unbanText', button: 'admin.unban', variant: 'success',
	},
};

const run = async (): Promise<void> => {
	const u = user.value!;
	const action = confirming.value!;
	saving.value = true;
	try {
		if (action === 'grant' || action === 'revoke') {
			await api(`/admin/users/${u.id}`, 'PATCH', { isAdmin: action === 'grant' });
			toast.success(t('admin.roleUpdated'));
		} else if (action === 'ban') {
			await api(`/admin/users/${u.id}/ban`, 'POST', { reason: reason.value });
			toast.success(t('admin.banned', { name: u.username }));
		} else {
			await api(`/admin/users/${u.id}/ban`, 'DELETE');
			toast.success(t('admin.unbanned', { name: u.username }));
		}
		confirming.value = null;
		reason.value = '';
		emit('changed');
		await load(u.id);
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<BaseModal
		:open="userId !== null"
		:title="user && confirming ? t(CONFIRM[confirming].title, { name: user.username }) : (user?.username ?? t('common.loading'))"
		@close="confirming ? (confirming = null) : emit('close')"
	>
		<p v-if="!user" class="muted">{{ t('common.loading') }}</p>

		<template v-else-if="confirming">
			<p>{{ t(CONFIRM[confirming].text) }}</p>
			<label v-if="confirming === 'ban'" class="reason">
				<span>{{ t('admin.banReason') }}</span>
				<textarea v-model="reason" rows="3" maxlength="300"></textarea>
			</label>
		</template>

		<div v-else class="detail">
			<header class="who">
				<span class="portrait"><AvatarIcon :value="user.avatar" /></span>
				<div class="who-text">
					<NameTag :name="user.username" :look="user.avatar" />
					<div class="badges">
						<span v-if="user.bannedAt" class="badge bad">{{ t('admin.status.banned') }}</span>
						<span class="badge" :class="{ accent: user.isAdmin }">{{ t(user.isAdmin ? 'admin.role.admin' : 'admin.role.user') }}</span>
						<span class="badge">{{ user.plan }}</span>
						<span v-if="isSelf" class="badge">{{ t('admin.you') }}</span>
					</div>
				</div>
			</header>

			<div v-if="user.bannedAt" class="ban-box">
				<strong>{{ t('admin.bannedOn', { date: formatDate(user.bannedAt) }) }}</strong>
				<p class="selectable">{{ user.banReason ?? t('admin.noReason') }}</p>
			</div>

			<dl class="facts">
				<div><dt>{{ t('admin.info.email') }}</dt><dd class="selectable">{{ user.email ?? '—' }}</dd></div>
				<div><dt>{{ t('admin.info.joined') }}</dt><dd>{{ formatDate(user.createdAt) }}</dd></div>
				<div><dt>{{ t('admin.info.login') }}</dt><dd>
					<template v-if="user.hasPassword || user.providers.length">
						<span v-if="user.hasPassword" class="login">{{ t('admin.info.password') }}</span>
						<span v-for="provider in user.providers" :key="provider" class="login provider">{{ provider }}</span>
					</template>
					<template v-else>—</template>
				</dd></div>
				<div><dt>{{ t('admin.col.games') }}</dt><dd>{{ user.gamesPlayed }}</dd></div>
				<div><dt>{{ t('admin.info.score') }}</dt><dd>{{ user.totalScore.toLocaleString(locale) }}</dd></div>
				<div><dt>{{ t('admin.col.quizzes') }}</dt><dd>{{ user.quizzes }}</dd></div>
			</dl>

			<ul v-if="user.quizList.length" class="quizzes">
				<li v-for="quiz in user.quizList" :key="quiz.id" :class="{ deleted: quiz.deleted }">
					<span class="quiz-title">{{ quiz.title }}</span>
					<span class="muted">{{ quiz.questions }} {{ tp('dash.questions', quiz.questions) }}</span>
					<span v-if="quiz.deleted" class="badge bad">{{ t('admin.status.deleted') }}</span>
					<span v-else-if="quiz.isOpen" class="badge good">{{ t('admin.status.open') }}</span>
				</li>
			</ul>
			<p v-else class="muted">{{ t('admin.info.noQuiz') }}</p>
		</div>

		<template #actions>
			<template v-if="user && confirming">
				<BaseButton variant="ghost" @click="confirming = null">{{ t('common.cancel') }}</BaseButton>
				<BaseButton :variant="CONFIRM[confirming].variant" :loading="saving" @click="run">{{ t(CONFIRM[confirming].button) }}</BaseButton>
			</template>
			<template v-else>
				<BaseButton variant="ghost" @click="emit('close')">{{ t('common.close') }}</BaseButton>
				<template v-if="user && !isSelf">
					<BaseButton variant="ghost" @click="confirming = user.isAdmin ? 'revoke' : 'grant'">
						{{ t(user.isAdmin ? 'admin.removeAdmin' : 'admin.makeAdmin') }}
					</BaseButton>
					<BaseButton v-if="user.bannedAt" variant="success" @click="confirming = 'unban'">{{ t('admin.unban') }}</BaseButton>
					<BaseButton v-else variant="danger" @click="confirming = 'ban'">{{ t('admin.ban') }}</BaseButton>
				</template>
			</template>
		</template>
	</BaseModal>
</template>

<style scoped>
.detail {
	display: grid;
	gap: 1rem;
}

.who {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.portrait {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 4.5rem;
	height: 4.5rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface-2);
	font-size: 2.6rem;
}

.who-text {
	display: grid;
	justify-items: start;
	gap: 0.5rem;
	min-width: 0;
	font-size: 1.15rem;
}

.badges {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	font-size: 0.85rem;
}

/* Copy of AdminView's .badge: the modal is teleported to <body>, out of reach of its :deep styles. */
.badge {
	display: inline-block;
	padding: 0.1rem 0.55rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--badge, var(--text-muted)) 18%, transparent);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--badge, var(--text-muted)) 45%, transparent);
	font-size: 0.8rem;
	font-weight: 600;
	white-space: nowrap;
}

.badge.good {
	--badge: var(--success);
}

.badge.bad {
	--badge: var(--danger);
}

.badge.accent {
	--badge: var(--accent-line);
}

.ban-box {
	padding: 0.75rem 1rem;
	border: 1px solid color-mix(in srgb, var(--danger) 50%, transparent);
	border-radius: var(--radius-sm);
	background: color-mix(in srgb, var(--danger) 10%, transparent);
}

.ban-box strong {
	color: var(--danger);
}

.ban-box p {
	margin: 0.25rem 0 0;
	white-space: pre-wrap;
}

.facts {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	gap: 1px;
	margin: 0;
	overflow: hidden;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--border);
}

.facts div {
	padding: 0.55rem 0.8rem;
	background: var(--surface);
}

.facts dt {
	color: var(--text-muted);
	font-size: 0.72rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
}

.facts dd {
	margin: 0.1rem 0 0;
	overflow-wrap: anywhere;
	font-weight: 600;
}

.login + .login::before {
	content: ' · ';
}

.provider {
	text-transform: capitalize;
}

.quizzes {
	display: grid;
	max-height: 12rem;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	list-style: none;
}

.quizzes li {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.45rem 0.8rem;
	border-bottom: 1px solid var(--border);
}

.quizzes li:last-child {
	border-bottom: none;
}

.quiz-title {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.deleted .quiz-title {
	color: var(--text-muted);
	text-decoration: line-through;
}

.muted {
	margin: 0;
	color: var(--text-muted);
}

.reason {
	display: grid;
	gap: 0.35rem;
	font-weight: 600;
}
</style>
