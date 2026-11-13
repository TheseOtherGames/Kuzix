<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { ANSWER_COLORS } from '@/utils/Answers';
import logoUrl from '@/shared/icons/logo.svg?url';
import { t } from '@/i18n';

const LOGO_LETTERS = 'Kuzix';
const DOWNLOADS = [{ key: 'brand.dlLogo', href: logoUrl, file: 'kuzix-logo.svg' }, { key: 'brand.dlFavicon', href: '/favicon.svg', file: 'kuzix-favicon.svg' }, { key: 'brand.dlSocial', href: '/og-image.png', file: 'kuzix-social.png' }] as const;
</script>

<template>
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
</template>

<style scoped>
h2 {
	margin-bottom: 0.3rem;
}

.muted {
	color: var(--text-muted);
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
</style>
