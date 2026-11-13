<script setup lang="ts">
import { t } from '@/shared/i18n/i18n';
import type { MessageKey } from '@/shared/i18n/en';
import { toast } from '@/shared/toast.store';
import { ANSWER_COLORS, ANSWER_ICONS } from '@/shared/answers';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import logoUrl from '@/shared/icons/logo.svg?url';

const LOGO_LETTERS = 'Kuzix';

// Hex values mirror app/global.css: keep them in sync when the palette changes.
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
const DOWNLOADS = [{ key: 'brand.dlLogo', href: logoUrl, file: 'kuzix-logo.svg' }, { key: 'brand.dlFavicon', href: '/favicon.svg', file: 'kuzix-favicon.svg' }, { key: 'brand.dlSocial', href: '/og-image.png', file: 'kuzix-social.png' }] as const;
const RULES = [
	'brand.rule1',
	'brand.rule2',
	'brand.rule3',
	'brand.rule4',
] as const;

const copy = async (hex: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(hex);
		toast.success(t('brand.copied', { hex }));
	} catch {
		toast.error(t('brand.copyFailed'));
	}
};

// Light swatches need dark text, dark ones white text.
const inkOn = (hex: string): string => {
	const value = parseInt(hex.slice(1), 16);
	const luminance = (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;

	return luminance > 0.6 ? '#1e2230' : '#ffffff';
};
</script>

<template>
	<div class="brand">
		<header class="intro">
			<h1><AppIcon name="palette" /> {{ t('brand.title') }}</h1>
			<p>{{ t('brand.intro') }}</p>
		</header>

		<BaseCard accent="var(--color-1)">
			<h2>{{ t('brand.logo') }}</h2>
			<p class="muted">{{ t('brand.logoText') }}</p>
			<div class="logos">
				<figure class="logo-box dark">
					<span class="lockup"><AppIcon name="logo" class="mark" /><span v-for="(letter, letterIndex) in LOGO_LETTERS" :key="letterIndex" :style="{ color: ANSWER_COLORS[letterIndex] }">{{ letter }}</span></span>
					<figcaption>{{ t('brand.onDark') }}</figcaption>
				</figure>
				<figure class="logo-box light">
					<span class="lockup"><AppIcon name="logo" class="mark" /><span v-for="(letter, letterIndex) in LOGO_LETTERS" :key="letterIndex" :style="{ color: ANSWER_COLORS[letterIndex] }">{{ letter }}</span></span>
					<figcaption>{{ t('brand.onLight') }}</figcaption>
				</figure>
				<figure class="logo-box icon">
					<AppIcon name="logo" class="solo-mark" />
					<figcaption>{{ t('brand.appIcon') }}</figcaption>
				</figure>
			</div>
			<div class="downloads">
				<BaseButton v-for="item in DOWNLOADS" :key="item.file" variant="tool" :href="item.href" :download="item.file">
					<AppIcon name="download" /> {{ t(item.key) }}
				</BaseButton>
			</div>
		</BaseCard>

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

		<div class="duo">
			<BaseCard accent="var(--color-3)">
				<h2>{{ t('brand.type') }}</h2>
				<div class="font">
					<p class="sample fredoka">Aa Bb 123</p>
					<p><strong>Fredoka</strong> · {{ t('brand.fredoka') }}</p>
				</div>
				<div class="font">
					<p class="sample mono">AB12CD</p>
					<p><strong>JetBrains Mono</strong> · {{ t('brand.mono') }}</p>
				</div>
			</BaseCard>

			<BaseCard accent="var(--color-4)">
				<h2>{{ t('brand.shapes') }}</h2>
				<p class="muted">{{ t('brand.shapesText') }}</p>
				<div class="shapes">
					<span v-for="(icon, shapeIndex) in ANSWER_ICONS" :key="icon" class="shape" :style="{ background: ANSWER_COLORS[shapeIndex] }">
						<AppIcon :name="icon" />
					</span>
				</div>
			</BaseCard>
		</div>

		<BaseCard accent="var(--color-5)">
			<h2>{{ t('brand.style') }}</h2>
			<ul class="rules">
				<li v-for="rule in RULES" :key="rule"><AppIcon name="check" /> {{ t(rule) }}</li>
			</ul>
		</BaseCard>
	</div>
</template>

<style scoped>
.brand {
	display: grid;
	gap: 1.5rem;
}

.intro p,
.muted {
	color: var(--text-muted);
}

h2 {
	margin-bottom: 0.3rem;
}

h3 {
	margin: 1.25rem 0 0.6rem;
	font-size: 1rem;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.logos {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	gap: 1rem;
	margin-top: 1rem;
}

.logo-box {
	display: grid;
	place-items: center;
	gap: 0.75rem;
	margin: 0;
	padding: 2rem 1rem 1rem;
	border-radius: var(--radius);
	border: 1px solid var(--border);
}

/* Fixed backgrounds: the boxes show the logo on each theme, whatever the current one. */
.logo-box.dark {
	--logo-outline: #fff4ea;
	background: #10151f;
	color: #9ba7bf;
}

.logo-box.light {
	--logo-outline: #a3204a;
	background: #fff7ec;
	color: #565b69;
}

.solo-mark {
	width: 6rem;
	height: 6rem;
	filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.2));
}

.logo-box.icon {
	background: var(--surface-2);
	color: var(--text-muted);
}

figcaption {
	font-size: 0.85rem;
}

.lockup {
	display: inline-flex;
	align-items: center;
	font-size: 2.6rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
}

.lockup .mark {
	width: 1.5em;
	height: 1.5em;
	margin-right: 0.3rem;
	filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.2));
}

.downloads {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1rem;
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

.duo {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
	gap: 1.5rem;
}

.font {
	padding: 0.75rem 0;
	border-bottom: 1px dashed var(--border);
}

.font:last-child {
	border-bottom: none;
}

.sample {
	margin: 0;
	font-size: 2.5rem;
	font-weight: 700;
}

.sample.mono {
	font-family: var(--font-mono);
	letter-spacing: 0.15em;
}

.shapes {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
	margin-top: 1rem;
}

.shape {
	display: grid;
	place-items: center;
	width: 3.5rem;
	height: 3.5rem;
	border-radius: var(--radius-sm);
	font-size: 1.8rem;
	box-shadow: 0 0.3rem 0 rgba(0, 0, 0, 0.3);
}

.rules {
	display: grid;
	gap: 0.6rem;
	margin: 0.75rem 0 0;
	padding: 0;
	list-style: none;
}

.rules li {
	display: flex;
	gap: 0.5rem;
	align-items: baseline;
}
</style>
