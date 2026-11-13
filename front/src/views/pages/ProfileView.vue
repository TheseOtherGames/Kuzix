<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import ConfirmModal from '@/views/components/utils/modal/ConfirmModal.vue';
import LeaveModal from '@/views/components/utils/modal/LeaveModal.vue';
import PlayerReport from '@/views/components/game/PlayerReport.vue';
import ProfileTabs from '@/views/components/profile/ProfileTabs.vue';
import AppearanceCard from '@/views/components/profile/AppearanceCard.vue';
import ProfileStats from '@/views/components/profile/ProfileStats.vue';
import GameHistory from '@/views/components/profile/GameHistory.vue';
import SettingsCard from '@/views/components/profile/SettingsCard.vue';
import AccountCard from '@/views/components/profile/AccountCard.vue';
import type { PlayerAnswerDetail } from '@/interfaces/Quiz/QuizInterface';
import type { PlayHistoryEntry, Profile, UserStats } from '@/interfaces/User/UserInterface';
import { api } from '@/utils/API';
import { auth, logout, updateProfile } from '@/utils/Auth';
import { downloadFile } from '@/utils/Download';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';

type Tab = 'profile' | 'statistics' | 'settings';

const tabs = computed(() => [{ value: 'profile' as Tab, label: t('profile.tabProfile'), icon: 'smile' }, { value: 'statistics' as Tab, label: t('profile.tabStats'), icon: 'chart' }, { value: 'settings' as Tab, label: t('profile.tabSettings'), icon: 'gear' }]);

// Each tab has its own URL: /profile, /profile/statistics, /profile/settings.
const route = useRoute();
const tab = computed<Tab>(() => (route.params.tab as Tab | undefined) || 'profile');
const setTab = (value: Tab): Promise<unknown> => router.push(value === 'profile' ? '/profile' : `/profile/${value}`);
const profile = ref<Profile>({ nickname: auth.user!.username, avatar: auth.user!.avatar });
const saving = ref(false);
const router = useRouter();
const confirmingDelete = ref(false);
const deleting = ref(false);

const exporting = ref(false);

const exportData = async (): Promise<void> => {
	exporting.value = true;
	try {
		downloadFile('my-data.json', JSON.stringify(await api<unknown>('/users/me/export'), null, '\t'), 'application/json');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		exporting.value = false;
	}
};

const deleteAccount = async (): Promise<void> => {
	deleting.value = true;
	try {
		await api('/users/me', 'DELETE');
		logout();
		toast.success(t('profile.accountDeleted'));
		await router.push('/');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		deleting.value = false;
		confirmingDelete.value = false;
	}
};

// Unsaved-changes workflow: the bar, the tab dot and the leave guard all read `dirty`.
// No user (logged out / session expired) = nothing to save, so never block leaving.
const dirty = computed(() => !!auth.user && (profile.value.nickname.trim() !== auth.user.username || profile.value.avatar !== auth.user.avatar));
const justSaved = ref(false);
const pendingLeave = ref<RouteLocationNormalized | null>(null);

const undo = (): void => {
	profile.value = { nickname: auth.user!.username, avatar: auth.user!.avatar };
};

onBeforeRouteLeave((to) => {
	if (!dirty.value) {
		return true;
	}
	pendingLeave.value = to;

	return false;
});

const leave = async (withSave: boolean): Promise<void> => {
	const to = pendingLeave.value!;
	if (withSave && !(await save())) {
		return;
	}
	if (!withSave) {
		undo();
	}
	pendingLeave.value = null;
	await router.push(to.fullPath);
};

const onBeforeUnload = (event: BeforeUnloadEvent): void => {
	if (dirty.value) {
		event.preventDefault();
	}
};
window.addEventListener('beforeunload', onBeforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload));
const stats = ref<UserStats | null>(null);
const history = ref<PlayHistoryEntry[]>([]);
const selected = ref<PlayHistoryEntry | null>(null);
const answers = ref<PlayerAnswerDetail[]>([]);

const statTiles = computed(() => {
	if (!stats.value) {
		return [];
	}
	const accuracy = stats.value.answered ? Math.round((stats.value.correct / stats.value.answered) * 100) : 0;

	return [
		{ label: t('profile.gamesPlayed'), value: stats.value.gamesPlayed },
		{ label: t('profile.totalPoints'), value: stats.value.totalScore },
		{ label: t('profile.bestRank'), value: stats.value.bestRank ? `#${stats.value.bestRank}` : '–' },
		{ label: t('profile.accuracy'), value: `${accuracy}%` },
	];
});

onMounted(async () => {
	try {
		[stats.value, history.value] = await Promise.all([api<UserStats>('/users/me/stats'), api<PlayHistoryEntry[]>('/users/me/history')]);
	} catch (error) {
		toast.error((error as Error).message);
	}
});

const save = async (): Promise<boolean> => {
	saving.value = true;
	try {
		await updateProfile(profile.value);
		profile.value = { nickname: auth.user!.username, avatar: auth.user!.avatar };
		toast.success(t('profile.updated'));
		justSaved.value = true;
		setTimeout(() => {
			justSaved.value = false;
		}, 2500);

		return true;
	} catch (error) {
		toast.error((error as Error).message);

		return false;
	} finally {
		saving.value = false;
	}
};

const showGame = async (entry: PlayHistoryEntry): Promise<void> => {
	try {
		answers.value = await api<PlayerAnswerDetail[]>(`/users/me/history/${entry.playerId}`);
		selected.value = entry;
	} catch (error) {
		toast.error((error as Error).message);
	}
};
</script>

<template>
	<div class="profile">
		<h1>{{ t('profile.title') }}</h1>

		<ProfileTabs :tabs="tabs" :active="tab" :dirty-tab="dirty ? 'profile' : null" @select="setTab" />

		<section v-if="tab === 'profile'" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
			<AppearanceCard v-model="profile" :dirty="dirty" :saving="saving" :saved="justSaved" @save="save" @undo="undo" />
		</section>

		<section v-else-if="tab === 'statistics'" id="panel-statistics" role="tabpanel" aria-labelledby="tab-statistics" class="panel">
			<ProfileStats :tiles="statTiles" />
			<GameHistory :history="history" @show="showGame" />
		</section>

		<section v-else id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" class="settings-panel">
			<SettingsCard class="narrow" />
			<AccountCard class="narrow" :exporting="exporting" @export="exportData" @delete="confirmingDelete = true" />
		</section>

		<BaseModal :open="Boolean(selected)" :title="selected?.quizTitle ?? ''" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selected.playersCount" :answers="answers" />
		</BaseModal>

		<ConfirmModal :open="confirmingDelete" :title="t('profile.deleteTitle')" :confirm-label="t('profile.deleteAccount')" icon="trash" :loading="deleting" @close="confirmingDelete = false" @confirm="deleteAccount">
			<p>{{ t('profile.deleteText') }}</p>
		</ConfirmModal>

		<LeaveModal :open="pendingLeave !== null" :text="t('pf.leaveText')" :saving="saving" wide @stay="pendingLeave = null" @discard="leave(false)" @save="leave(true)" />
	</div>
</template>

<style scoped>
.profile {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.profile > h1 {
	margin: 0;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.settings-panel {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 1.5rem;
}

/* Side by side when the window is wide enough, stacked otherwise. */
.settings-panel > * {
	flex: 1 1 22rem;
}

.narrow {
	max-width: 36rem;
}
</style>
