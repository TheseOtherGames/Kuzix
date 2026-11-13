<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { LOCALES, locale, t } from '@/i18n';
import { cycleTheme, theme, THEME_ICONS } from '@/utils/Theme';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import PillButton from '@/views/components/utils/form/PillButton.vue';
import TopBar from '@/views/components/layout/TopBar.vue';

const toggleLocale = (): void => {
	locale.value = locale.value === 'en' ? 'fr' : 'en';
};

const localeLabel = (): string => LOCALES.find((option) => option.value === locale.value)!.label;

defineProps<{
	title: string;
	backTo: RouteLocationRaw;
	backLabel: string;
	backIcon: 'back' | 'close';
}>();
</script>

<template>
	<TopBar>
		<PillButton :to="backTo" :label="backLabel" class="back" :class="`is-${backIcon}`">
			<svg v-if="backIcon === 'back'" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
			<svg v-else viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
		</PillButton>
		<strong class="title">{{ title }}</strong>
		<div class="extras">
			<slot />
			<span class="divider" aria-hidden="true"></span>
			<button
				type="button"
				class="round"
				:data-tip="t('header.theme', { theme: t(`theme.${theme}`) })"
				:aria-label="t('header.theme', { theme: t(`theme.${theme}`) })"
				@click="cycleTheme"
			>
				<AppIcon :name="THEME_ICONS[theme]" />
			</button>
			<button
				type="button"
				class="round lang"
				:data-tip="`${t('footer.language')}: ${localeLabel()}`"
				:aria-label="`${t('footer.language')}: ${localeLabel()}`"
				@click="toggleLocale"
			>
				{{ locale.toUpperCase() }}
			</button>
		</div>
	</TopBar>
</template>

<style scoped>
.back {
	margin-left: -0.8rem;
}

.back svg {
	width: 1.15rem;
	height: 1.15rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.6;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.round,
:slotted(.round) {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--surface-2);
	color: var(--text);
	font-size: 1.1rem;
	text-decoration: none;
	cursor: pointer;
	transition: transform 0.2s, background 0.15s, color 0.15s;
}

.round .app-icon,
:slotted(.round .app-icon) {
	font-size: 1.35em;
}

.round:hover,
:slotted(.round:hover) {
	background: var(--accent);
	color: var(--on-accent);
	transform: scale(1.08);
}

.title {
	flex: 1;
	overflow: hidden;
	font-size: 1.1rem;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.extras {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.35rem;
}

.divider {
	width: 1px;
	height: 1.6rem;
	margin: 0 0.2rem;
	background: var(--border);
}

.lang {
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.03em;
}

:slotted(.chip) {
	padding: 0.3rem 0.8rem;
	border-radius: 999px;
	background: var(--surface-2);
	font-weight: 700;
	white-space: nowrap;
}

:slotted(.chip.accent) {
	background: var(--accent);
	color: var(--on-accent);
}

@media (max-width: 640px) {
	.back {
		margin-left: -0.55rem;
	}

	.divider {
		display: none;
	}

	.extras {
		gap: 0.25rem;
	}

	.round,
	:slotted(.round) {
		width: 2.2rem;
		height: 2.2rem;
	}
}
</style>
