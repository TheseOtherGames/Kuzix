<script setup lang="ts">
import AppHeader from '@/views/components/layout/AppHeader.vue';
import ToastContainer from '@/views/components/utils/notification/ToastContainer.vue';
import { LOCALES, locale, t } from '@/i18n';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import ChangelogModal from '@/views/components/layout/ChangelogModal.vue';
import { CURRENT_VERSION } from '@/utils/Changelog';

const route = useRoute();

const setMeta = (selector: string, attr: string, value: string): void => {
	document.head.querySelector(selector)?.setAttribute(attr, value);
};

// index.html holds the default tags (and the build-time site URL); this keeps them in sync with the route and language.
watchEffect(() => {
	const seo = route.meta.seo;
	const title = seo ? t(seo.title) : 'Kuzix';
	const url = location.origin + route.path;
	document.title = title;
	setMeta('meta[property="og:title"]', 'content', title);
	setMeta('meta[name="twitter:title"]', 'content', title);
	if (seo) {
		for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
			setMeta(selector, 'content', t(seo.description));
		}
	}
	setMeta('meta[property="og:url"]', 'content', url);
	setMeta('link[rel="canonical"]', 'href', url);
	setMeta('meta[name="robots"]', 'content', seo ? 'index, follow, max-image-preview:large' : 'noindex');
	setMeta('meta[property="og:locale"]', 'content', locale.value === 'fr' ? 'fr_FR' : 'en_US');
});

const SEEN_KEY = 'kuzix-seen-version';
const changelogOpen = ref(false);
const unseen = ref(localStorage.getItem(SEEN_KEY) !== CURRENT_VERSION);

const openChangelog = (): void => {
	changelogOpen.value = true;
	unseen.value = false;
	localStorage.setItem(SEEN_KEY, CURRENT_VERSION);
};
</script>

<template>
	<AppHeader v-if="!$route.meta.immersive" />
	<main class="main" :class="{ immersive: $route.meta.immersive }">
		<RouterView />
	</main>
	<footer v-if="!$route.meta.immersive" class="footer">
		<span>© {{ new Date().getFullYear() }} Kuzix - {{ t('footer.by') }} <a class="studio" href="https://github.com/theseothergames" target="_blank" rel="noopener noreferrer">TheseOtherGames</a></span>
		<RouterLink to="/brand" class="studio">{{ t('footer.brand') }}</RouterLink>
		<span class="langs" role="group" :aria-label="t('footer.language')">
			<button
				v-for="option in LOCALES"
				:key="option.value"
				type="button"
				:lang="option.value"
				:title="option.label"
				:aria-pressed="locale === option.value"
				@click="locale = option.value"
			>
				{{ option.value.toUpperCase() }}
			</button>
		</span>
		<button type="button" class="version" :class="{ unseen }" :title="t('changelog.open')" :aria-label="t('changelog.open')" @click="openChangelog">
			<AppIcon name="sparkles" />v{{ CURRENT_VERSION }}
		</button>
	</footer>
	<ChangelogModal :open="changelogOpen" @close="changelogOpen = false" />
	<ToastContainer />
</template>

<style scoped>
.main {
	width: min(100%, 72rem);
	margin: 0 auto;
	padding: clamp(1rem, 3vw, 2rem);
}

.footer {
	margin-top: auto;
	padding: 1.25rem clamp(1rem, 3vw, 2rem);
	border-top: 1px solid var(--border);
	color: var(--text-muted);
	font-size: 0.9rem;
	text-align: center;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.5rem 1rem;
}

.studio {
	font-weight: 700;
	text-decoration: none;
	color: var(--accent-text);
}

.studio:hover {
	text-decoration: underline;
}

.langs {
	display: inline-flex;
	padding: 0.15rem;
	border-radius: 999px;
	background: var(--surface-2);
}

.langs button {
	padding: 0.1rem 0.6rem;
	border: none;
	border-radius: 999px;
	background: none;
	color: var(--text-muted);
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.langs button:hover {
	color: var(--text);
}

.langs button[aria-pressed='true'] {
	background: var(--accent);
	color: var(--on-accent);
}

.version {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.2rem 0.7rem;
	border: none;
	border-radius: 999px;
	background: var(--surface-2);
	color: var(--text-muted);
	font-family: var(--font-mono);
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition: transform 0.2s, color 0.15s, box-shadow 0.15s;
}

.version:hover {
	color: var(--text);
	box-shadow: 0 0 0 2px var(--accent-line);
	transform: translateY(-1px);
}

/* Dot until the visitor opens the changelog of the current version. */
.version.unseen::after {
	content: '';
	position: absolute;
	top: -0.1rem;
	right: -0.1rem;
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0 0 2px var(--bg);
	animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
	50% {
		transform: scale(1.35);
	}
}

.main.immersive {
	width: 100%;
	min-height: 100dvh;
	padding: 0;
}
</style>
