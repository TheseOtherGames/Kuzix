<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import type { MessageKey } from '@/locales/en';
import { copyText } from '@/utils/Clipboard';
import { t } from '@/i18n';

// Hex values mirror assets/styles/main.css: keep them in sync when the palette changes.
const MAIN_COLORS = [
	{ name: 'Rose', variable: '--color-1', hex: '#ff3d71' },
	{ name: 'Blue', variable: '--color-2', hex: '#3d8bff' },
	{ name: 'Yellow', variable: '--color-3', hex: '#ffb800' },
	{ name: 'Green', variable: '--color-4', hex: '#1fc96f' },
	{ name: 'Purple', variable: '--color-5', hex: '#9b5cff' },
	{ name: 'Orange', variable: '--color-6', hex: '#ff7a2f' },
];
const THEMES = [
	{
		key: 'brand.themeDark',
		colors: [
			{ name: 'Background', hex: '#10151f' },
			{ name: 'Surface', hex: '#1a2130' },
			{ name: 'Surface 2', hex: '#252e40' },
			{ name: 'Text', hex: '#f2f5fb' },
			{ name: 'Muted', hex: '#9ba7bf' },
			{ name: 'Accent', hex: '#8a45f5' },
		],
	},
	{
		key: 'brand.themeLight',
		colors: [
			{ name: 'Background', hex: '#fff7ec' },
			{ name: 'Surface', hex: '#ffffff' },
			{ name: 'Surface 2', hex: '#f7eedf' },
			{ name: 'Text', hex: '#1e2230' },
			{ name: 'Muted', hex: '#565b69' },
			{ name: 'Accent', hex: '#ffa07a' },
		],
	},
] as const;

const copy = (hex: string): Promise<boolean> => copyText(hex, t('brand.copied', { hex }), t('brand.copyFailed'));

// Light swatches need dark text, dark ones white text.
const inkOn = (hex: string): string => {
	const value = parseInt(hex.slice(1), 16);
	const luminance = (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;

	return luminance > 0.6 ? '#1e2230' : '#ffffff';
};
</script>

<template>
	<BaseCard accent="var(--color-2)">
		<h2>{{ t('brand.colors') }}</h2>
		<p class="muted">{{ t('brand.colorsText') }}</p>
		<div class="swatches">
			<button
				v-for="color in MAIN_COLORS"
				:key="color.hex"
				type="button"
				class="swatch"
				:style="{ background: color.hex, color: inkOn(color.hex) }"
				:aria-label="t('brand.copy', { hex: color.hex })"
				@click="copy(color.hex)"
			>
				<strong>{{ color.name }}</strong>
				<span class="code">{{ color.hex }}</span>
				<span class="code small">{{ color.variable }}</span>
			</button>
		</div>
		<div v-for="themeGroup in THEMES" :key="themeGroup.key" class="theme">
			<h3>{{ t(themeGroup.key as MessageKey) }}</h3>
			<div class="chips">
				<button
					v-for="color in themeGroup.colors"
					:key="color.name"
					type="button"
					class="chip"
					:aria-label="t('brand.copy', { hex: color.hex })"
					@click="copy(color.hex)"
				>
					<span class="dot" :style="{ background: color.hex }"></span>
					<span>{{ color.name }}</span>
					<span class="code">{{ color.hex }}</span>
				</button>
			</div>
		</div>
	</BaseCard>
</template>

<style scoped>
h2 {
	margin-bottom: 0.3rem;
}

.muted {
	color: var(--text-muted);
}

h3 {
	margin: 1.25rem 0 0.6rem;
	font-size: 1rem;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.swatches {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
}

.swatch {
	display: grid;
	gap: 0.15rem;
	min-height: 7rem;
	align-content: end;
	padding: 0.8rem;
	border: none;
	border-radius: var(--radius);
	text-align: left;
	cursor: pointer;
	box-shadow: 0 0.3rem 0 rgba(0, 0, 0, 0.3);
	transition: transform 0.15s, box-shadow 0.15s;
}

.swatch:hover {
	transform: translateY(-0.15rem);
	box-shadow: 0 0.45rem 0 rgba(0, 0, 0, 0.3);
}

.code {
	font-family: var(--font-mono);
	font-size: 0.85rem;
}

.code.small {
	font-size: 0.75rem;
	opacity: 0.8;
}

.chips {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.35rem 0.8rem 0.35rem 0.4rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: var(--surface-2);
	color: var(--text);
	cursor: pointer;
	transition: box-shadow 0.15s;
}

.chip:hover {
	box-shadow: 0 0 0 2px var(--accent-line);
}

.dot {
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.4);
}
</style>
