<script setup lang="ts">
import AppIcon from '../../shared/ui/AppIcon.vue';
import AvatarIcon from '../../shared/ui/AvatarIcon.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseCard from '../../shared/ui/BaseCard.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import InfoTip from '../../shared/ui/InfoTip.vue';
import PlayerReport from '../../shared/ui/PlayerReport.vue';
import ProfileForm from '../../shared/ui/ProfileForm.vue';
import SaveBar from '../../shared/ui/SaveBar.vue';
import type { PlayerAnswerDetail } from '../quiz/quiz.types';
import type { PlayHistoryEntry, Profile, UserStats } from '../auth/user.types';
import { api } from '../../shared/api';
import { ANSWER_COLORS } from '../../shared/answers';
import { auth, PROVIDER_LABELS, updateProfile } from '../auth/auth.store';
import { LOCALES, locale, t } from '../../shared/i18n/i18n';
import { theme, type Theme } from '../../shared/theme.store';
import { toast } from '../../shared/toast.store';

type Tab = 'profile' | 'statistics' | 'settings';

const TABS: { value: Tab; key: 'profile.tabProfile' | 'profile.tabStats' | 'profile.tabSettings'; icon: string }[] = [{ value: 'profile', key: 'profile.tabProfile', icon: 'smile' }, { value: 'statistics', key: 'profile.tabStats', icon: 'chart' }, { value: 'settings', key: 'profile.tabSettings', icon: 'gear' }];
const THEMES: { value: Theme; icon: string }[] = [{ value: 'system', icon: 'monitor' }, { value: 'dark', icon: 'moon' }, { value: 'light', icon: 'sun' }];

const settingGroups = computed(() => [
	{
		id: 'locale',
		icon: 'globe',
		tint: 'var(--color-2)',
		model: locale,
		title: t('settings.language'),
		info: t('settings.languageInfo'),
		options: LOCALES.map((option) => ({ value: option.value, icon: option.flag, label: option.label })),
	},
	{
		id: 'theme',
		icon: 'palette',
		tint: 'var(--color-5)',
		model: theme,
		title: t('settings.theme'),
		info: t('settings.themeInfo'),
		options: THEMES.map((option) => ({ value: option.value, icon: option.icon, label: t(`theme.${option.value}`) })),
	},
]);

// Each tab has its own URL: /profile, /profile/statistics, /profile/settings.
const route = useRoute();
const tab = computed<Tab>(() => (route.params.tab as Tab | undefined) || 'profile');
const setTab = (value: Tab): Promise<unknown> => router.push(value === 'profile' ? '/profile' : `/profile/${value}`);
const profile = ref<Profile>({ nickname: auth.user!.username, avatar: auth.user!.avatar });
const saving = ref(false);
const router = useRouter();

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

// WAI-ARIA tabs: arrow keys move between tabs.
const onTabKey = async (event: KeyboardEvent): Promise<void> => {
	const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
	if (!offset) {
		return;
	}
	const index = (TABS.findIndex((entry) => entry.value === tab.value) + offset + TABS.length) % TABS.length;
	await setTab(TABS[index].value);
	document.getElementById(`tab-${TABS[index].value}`)?.focus();
};
</script>

<template>
	<div class="profile">
		<h1>{{ t('profile.title') }}</h1>

		<div class="tabs" role="tablist" @keydown="onTabKey">
			<button
				v-for="entry in TABS"
				:id="`tab-${entry.value}`"
				:key="entry.value"
				type="button"
				role="tab"
				class="tab"
				:aria-selected="tab === entry.value"
				:aria-controls="`panel-${entry.value}`"
				:tabindex="tab === entry.value ? 0 : -1"
				@click="setTab(entry.value)"
			>
				<AppIcon :name="entry.icon" />{{ t(entry.key) }}
				<span v-if="entry.value === 'profile' && dirty" class="tab-dot" :title="t('pf.unsaved')" aria-hidden="true"></span>
			</button>
		</div>

		<section v-if="tab === 'profile'" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
			<BaseCard accent="var(--accent)">
				<h2 class="card-title">
					{{ t('profile.appearance') }}<InfoTip :text="t('profile.appearanceInfo')" />
					<span v-if="dirty" class="unsaved-pill">{{ t('pf.unsaved') }}</span>
				</h2>
				<form class="form" @submit.prevent="save">
					<ProfileForm v-model="profile" />
					<SaveBar :dirty="dirty" :saving="saving" :saved="justSaved" @undo="undo" />
				</form>
			</BaseCard>
		</section>

		<section v-else-if="tab === 'statistics'" id="panel-statistics" role="tabpanel" aria-labelledby="tab-statistics" class="panel">
			<div class="stats">
				<div v-for="(tile, i) in statTiles" :key="tile.label" class="stat" :style="{ '--stat-color': ANSWER_COLORS[i] }">
					<span class="value">{{ tile.value }}</span>
					<span class="label">{{ tile.label }}</span>
				</div>
			</div>

			<BaseCard accent="var(--color-2)">
				<h2>{{ t('profile.myGames') }}</h2>
				<p v-if="!history.length" class="muted">{{ t('profile.noGames') }}</p>
				<ul class="history">
					<li v-for="entry in history" :key="entry.playerId">
						<button type="button" class="game" @click="showGame(entry)">
							<span class="avatar" aria-hidden="true"><AvatarIcon :value="entry.avatar" /></span>
							<span class="info">
								<strong>{{ entry.quizTitle }}</strong>
								<span class="muted">{{ new Date(entry.playedAt).toLocaleDateString(locale) }}</span>
							</span>
							<span class="score">
								{{ t('common.pts', { n: entry.score }) }}
								<span class="muted">{{ entry.rank ? `#${entry.rank}` : '–' }} / {{ entry.playersCount }}</span>
							</span>
						</button>
					</li>
				</ul>
			</BaseCard>
		</section>

		<section v-else id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" class="settings-panel">
			<BaseCard accent="var(--color-3)" class="narrow settings">
				<section v-for="group in settingGroups" :key="group.id" class="setting">
					<header class="setting-head">
						<span class="setting-icon" :style="{ '--tint': group.tint }" ><AppIcon :name="group.icon" /></span>
						<span>
							<h2 :id="`setting-${group.id}`">{{ group.title }}</h2>
							<p class="muted">{{ group.info }}</p>
						</span>
					</header>
					<div class="choices" role="radiogroup" :aria-labelledby="`setting-${group.id}`">
						<label v-for="option in group.options" :key="option.value" class="choice" :class="{ active: group.model.value === option.value }">
							<input v-model="group.model.value" type="radio" :name="group.id" :value="option.value" />
							<span class="icon"><AppIcon :name="option.icon" /></span>
							<span class="choice-label">{{ option.label }}</span>
						</label>
					</div>
				</section>
			</BaseCard>

			<BaseCard accent="var(--color-2)" class="narrow account">
				<h2>{{ t('profile.account') }}</h2>
				<p v-if="auth.user?.email"><strong>{{ t('auth.email') }}</strong> <span class="selectable">{{ auth.user.email }}</span></p>
				<p>
					<strong>{{ t('profile.loginMethods') }}</strong>
					{{ auth.user?.providers.map((provider) => provider === 'password' ? t('profile.passwordLogin') : PROVIDER_LABELS[provider] ?? provider).join(', ') }}
				</p>
			</BaseCard>
		</section>

		<BaseModal :open="Boolean(selected)" :title="selected?.quizTitle ?? ''" wide @close="selected = null">
			<PlayerReport v-if="selected" :player="selected" :players-count="selected.playersCount" :answers="answers" />
		</BaseModal>

		<BaseModal :open="pendingLeave !== null" :title="t('pf.leaveTitle')" wide @close="pendingLeave = null">
			<p>{{ t('pf.leaveText') }}</p>
			<template #actions>
				<BaseButton variant="ghost" @click="pendingLeave = null">{{ t('pf.leaveStay') }}</BaseButton>
				<BaseButton variant="danger" @click="leave(false)">{{ t('pf.leaveDiscard') }}</BaseButton>
				<BaseButton :loading="saving" @click="leave(true)"><AppIcon name="save" /> {{ t('pf.leaveSave') }}</BaseButton>
			</template>
		</BaseModal>
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

.tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	width: fit-content;
	max-width: 100%;
	padding: 0.35rem;
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow);
}

.tab {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 1.1rem;
	border: none;
	border-radius: 999px;
	background: none;
	color: var(--text-muted);
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.tab:hover {
	background: var(--surface-2);
	color: var(--text);
}

.tab[aria-selected='true'] {
	background: var(--accent);
	color: var(--on-accent);
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--accent) 55%, black);
}

@media (max-width: 480px) {
	.tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: 100%;
		border-radius: var(--radius);
	}

	.tab {
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.45rem 0.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
	}
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

.account p {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin: 0.4rem 0 0;
	overflow-wrap: anywhere;
}

.narrow {
	max-width: 36rem;
}

.settings {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.setting + .setting {
	margin-top: 1.25rem;
	padding-top: 1.25rem;
	border-top: 2px dashed var(--border);
}

.setting-head {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 0.9rem;
}

.setting-head h2 {
	margin: 0;
	font-size: 1.15rem;
}

.setting-head p {
	margin: 0.15rem 0 0;
	font-size: 0.9rem;
	line-height: 1.35;
}

.setting-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 25%, var(--surface-2));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tint) 55%, transparent);
	font-size: 1.3rem;
}

.choices {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
	gap: 0.6rem;
}

.choice {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.65rem 0.9rem;
	border: 2px solid var(--border);
	border-radius: 999px;
	background: var(--surface-2);
	font-weight: 600;
	cursor: pointer;
	transition: transform 0.15s, border-color 0.15s, background 0.15s;
}

.choice:hover {
	transform: translateY(-0.15rem);
	border-color: color-mix(in srgb, var(--accent-line) 60%, var(--border));
}

.choice input {
	position: absolute;
	opacity: 0;
}

.choice:focus-within {
	outline: 3px solid var(--focus-ring);
	outline-offset: 2px;
}

.choice.active {
	border-color: var(--accent-line);
	background: color-mix(in srgb, var(--color-5) 18%, var(--surface));
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--accent) 55%, black);
}

.choice.active::after {
	content: '✓';
	display: grid;
	place-items: center;
	width: 1.3rem;
	height: 1.3rem;
	margin-left: auto;
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-accent);
	font-size: 0.75rem;
	animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.choice .icon {
	font-size: 1.5rem;
	line-height: 1;
}

.choice-label {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	gap: 1rem;
}

.stat {
	display: flex;
	flex-direction: column;
	padding: 1rem 1.25rem;
	border-radius: var(--radius);
	background: var(--stat-color);
	color: var(--on-color);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--stat-color) 55%, black);
}

.value {
	font-size: 2rem;
	font-weight: 700;
	line-height: 1.1;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.card-title {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.4rem;
}

.unsaved-pill {
	padding: 0.15rem 0.7rem;
	border-radius: 999px;
	background: var(--color-3);
	color: #1e2230;
	font-size: 0.8rem;
	animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.tab-dot {
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	background: var(--color-3);
	box-shadow: 0 0 0 2px var(--surface);
}

@keyframes pop {
	from {
		transform: scale(0.6);
	}
}

.history {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.game {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.6rem 0.9rem;
	border: none;
	border-radius: var(--radius-sm);
	background: var(--surface-2);
	text-align: left;
	cursor: pointer;
	transition: padding-left 0.15s, box-shadow 0.15s;
}

/* Content shifts inside the row; the row itself stays in its box. */
.game:hover {
	padding-left: 1.15rem;
	box-shadow: inset 0.25rem 0 0 var(--color-2);
}

.game .avatar {
	font-size: 1.6rem;
}

.info,
.score {
	display: flex;
	flex-direction: column;
}

.info {
	flex: 1;
	min-width: 0;
}

.score {
	align-items: flex-end;
	font-weight: 700;
}
</style>
