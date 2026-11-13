<script setup lang="ts">
import { t } from '@/i18n';
import type { MessageKey } from '@/locales/en';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';

const props = defineProps<{ page: 'terms' | 'legal' }>();

const SECTIONS = {
	terms: [
		'purpose',
		'access',
		'account',
		'content',
		'data',
		'storage',
		'deletion',
		'liability',
		'changes',
		'contact',
	],
	legal: [
		'publisher',
		'director',
		'host',
		'property',
		'data',
	],
};

// ponytail: legal identity lives here, not in i18n; fill in before going live.
const INFO = {
	publisher: 'TheseOtherGames',
	email: 'erick.paoletti@gmail.com',
	director: 'Erick Paoletti',
	host: 'TheseOtherGames',
};

// {terms} survives t() so the template can swap it for a RouterLink.
const text = (key: string): string => t(`${props.page}.${key}` as MessageKey, { ...INFO, terms: '{terms}' });
</script>

<template>
	<div class="legal">
		<header>
			<h1><AppIcon name="page" /> {{ text('title') }}</h1>
			<p class="muted">{{ text('updated') }}</p>
			<p>{{ text('intro') }}</p>
		</header>
		<BaseCard>
			<section v-for="(key, i) in SECTIONS[page]" :key="key">
				<h2>{{ i + 1 }}. {{ text(`${key}.title`) }}</h2>
				<p class="selectable">
					<template v-for="(part, j) in text(`${key}.text`).split('{terms}')" :key="j">
						<RouterLink v-if="j" to="/terms">{{ t('footer.terms') }}</RouterLink>{{ part }}
					</template>
				</p>
			</section>
		</BaseCard>
	</div>
</template>

<style scoped>
.legal {
	display: grid;
	gap: 1.5rem;
	max-width: 50rem;
	margin: 0 auto;
}

.muted {
	color: var(--text-muted);
}

section + section {
	margin-top: 1.25rem;
	padding-top: 1.25rem;
	border-top: 2px dashed var(--border);
}

h2 {
	font-size: 1.2rem;
}

p {
	line-height: 1.6;
	white-space: pre-line;
}
</style>
