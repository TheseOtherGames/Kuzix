<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import IconHeading from '@/views/components/utils/text/IconHeading.vue';
import { LOCALES, locale, t } from '@/i18n';
import { theme, type Theme } from '@/utils/Theme';

const THEMES: { value: Theme; icon: string }[] = [{ value: 'system', icon: 'monitor' }, { value: 'dark', icon: 'moon' }, { value: 'light', icon: 'sun' }];

const groups = computed(() => [
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
</script>

<template>
	<BaseCard accent="var(--color-3)" class="settings">
		<section v-for="group in groups" :key="group.id" class="setting">
			<IconHeading :id="`setting-${group.id}`" :icon="group.icon" :title="group.title" :text="group.info" :tint="group.tint" level="h2" />
			<div class="choices" role="radiogroup" :aria-labelledby="`setting-${group.id}`">
				<label v-for="option in group.options" :key="option.value" class="choice" :class="{ active: group.model.value === option.value }">
					<input v-model="group.model.value" type="radio" :name="group.id" :value="option.value" />
					<span class="icon"><AppIcon :name="option.icon" /></span>
					<span class="choice-label">{{ option.label }}</span>
				</label>
			</div>
		</section>
	</BaseCard>
</template>

<style scoped>
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

@keyframes pop {
	from {
		transform: scale(0.6);
	}
}
</style>
