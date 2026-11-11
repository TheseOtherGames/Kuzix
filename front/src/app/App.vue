<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import ToastContainer from '../shared/ui/ToastContainer.vue';
import { LOCALES, locale, t } from '../shared/i18n/i18n';
</script>

<template>
	<AppHeader v-if="!$route.meta.immersive" />
	<main class="main" :class="{ immersive: $route.meta.immersive }">
		<RouterView />
	</main>
	<footer v-if="!$route.meta.immersive" class="footer">
		<span>© {{ new Date().getFullYear() }} Kuzix - {{ t('footer.by') }} <a class="studio" href="https://github.com/theseothergames" target="_blank" rel="noopener noreferrer">TheseOtherGames</a></span>
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
	</footer>
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

.main.immersive {
	width: 100%;
	min-height: 100dvh;
	padding: 0;
}
</style>
