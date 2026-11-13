<script setup lang="ts">
import AppIcon from '../shared/ui/AppIcon.vue';
import AvatarIcon from '../shared/ui/AvatarIcon.vue';
import { t } from '../shared/i18n/i18n';
import { useRouter } from 'vue-router';
import { auth, logout } from '../features/auth/auth.store';
import { cycleTheme, theme, THEME_ICONS } from '../shared/theme.store';
import { toast } from '../shared/toast.store';
import BaseButton from '../shared/ui/BaseButton.vue';
import PillButton from '../shared/ui/PillButton.vue';
import TopBar from '../shared/ui/TopBar.vue';

const LOGO_COLORS = [
	'var(--color-1)',
	'var(--color-2)',
	'var(--color-3)',
	'var(--color-4)',
	'var(--color-5)',
	'var(--color-6)',
];

const router = useRouter();

const onLogout = (): void => {
	logout();
	toast.info(t('header.seeYou'));
	router.push('/');
};
</script>

<template>
	<TopBar>
		<RouterLink to="/" class="logo" :aria-label="t('header.home')" :data-tip="t('header.home')">
			<AppIcon name="logo" class="logo-mark" />
			<span v-for="(letter, i) in 'Kuzix'" :key="i" :style="{ color: LOGO_COLORS[i % LOGO_COLORS.length] }">{{ letter }}</span>
		</RouterLink>
		<nav class="nav">
			<template v-if="auth.user">
				<PillButton to="/dashboard" :label="t('header.myQuizzes')"><AppIcon name="folder" /></PillButton>
				<PillButton to="/profile" :label="auth.user.username"><AvatarIcon :value="auth.user.avatar" /></PillButton>
				<PillButton v-if="auth.user.isAdmin" to="/admin" :label="t('header.admin')"><AppIcon name="crown" /></PillButton>
			</template>
			<span class="divider" aria-hidden="true"></span>
			<button
				type="button"
				class="round theme"
				:data-tip="t('header.theme', { theme: t(`theme.${theme}`) })"
				:aria-label="t('header.theme', { theme: t(`theme.${theme}`) })"
				@click="cycleTheme"
			>
				<AppIcon :name="THEME_ICONS[theme]" />
			</button>
			<button v-if="auth.user" type="button" class="round logout" :data-tip="t('common.logOut')" :aria-label="t('common.logOut')" @click="onLogout">
				<AppIcon name="power" />
			</button>
			<BaseButton v-else to="/login" size="sm" :data-tip="t('common.logIn')">{{ t('common.logIn') }}</BaseButton>
		</nav>
	</TopBar>
</template>

<style scoped>
.logo {
	position: relative;
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
	font-size: 1.6rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-decoration: none;
	text-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
	white-space: nowrap;
}

.logo::after {
	content: 'beta';
	position: absolute;
	right: -0.9rem;
	bottom: -0.35rem;
	padding: 0.05rem 0.35rem;
	border-radius: 999px;
	background: var(--accent);
	color: var(--on-accent);
	font-size: 0.55rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	text-shadow: none;
	transform: rotate(-8deg);
}

.logo .logo-mark {
	width: 1.5em;
	height: 1.5em;
	margin-right: 0.3rem;
	filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.2));
	transition: transform 0.2s;
}

.logo:hover .logo-mark {
	transform: rotate(-10deg) scale(1.1);
}

.logo span {
	display: inline-block;
	transition: transform 0.2s;
}

.logo:hover span:nth-child(odd) {
	transform: translateY(-0.2rem) rotate(-6deg);
}

.logo:hover span:nth-child(even) {
	transform: translateY(0.1rem) rotate(4deg);
}

.nav {
	display: flex;
	align-items: center;
	gap: 0.35rem;
}

.divider {
	width: 1px;
	height: 1.6rem;
	margin: 0 0.3rem;
	background: var(--border);
}

.round .app-icon {
	font-size: 1.35em;
}

.round {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--surface-2);
	color: var(--text);
	font-size: 1.15rem;
	cursor: pointer;
	transition: transform 0.2s, background 0.15s, color 0.15s;
}

.round .app-icon {
	transition: transform 0.2s;
}

/* Rotate the icon, not the button, so the tooltip stays level. */
.theme:hover .app-icon {
	transform: rotate(-20deg) scale(1.1);
}

.logout:hover {
	background: var(--danger);
	color: var(--on-color);
	transform: scale(1.08);
}

@media (max-width: 640px) {
	.divider {
		display: none;
	}

	.logo {
		font-size: 1.3rem;
	}
}
</style>
