<script setup lang="ts">
import { locale, t } from '../shared/i18n/i18n';
import AppIcon from '../shared/ui/AppIcon.vue';
import BaseModal from '../shared/ui/BaseModal.vue';
import { ISSUE_URL, RELEASES } from './changelog';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const COLORS = [
	'var(--color-5)',
	'var(--color-2)',
	'var(--color-4)',
	'var(--color-6)',
	'var(--color-1)',
	'var(--color-3)',
];
</script>

<template>
	<BaseModal :open="open" :title="t('changelog.title')" wide @close="emit('close')">
		<ol class="releases">
			<li v-for="(release, i) in RELEASES" :key="release.version" class="release" :style="{ '--tint': COLORS[i % COLORS.length] }">
				<header class="release-head">
					<span class="bubble"><AppIcon :name="i === 0 ? 'sparkles' : 'bookmark'" /></span>
					<span class="version">v{{ release.version }}</span>
					<span v-if="i === 0" class="latest">{{ t('changelog.latest') }}</span>
					<time v-if="release.date" class="date" :datetime="release.date">{{ new Date(`${release.date}T00:00`).toLocaleDateString(locale) }}</time>
				</header>
				<section v-for="section in release.sections" :key="section.type" class="section" :class="section.type">
					<h3 class="section-title">{{ t(`changelog.type.${section.type}`) }}</h3>
					<ul class="changes">
						<li v-for="change in section.changes" :key="change.text">
							{{ change.text }}
							<a v-if="change.issue" class="issue" :href="`${ISSUE_URL}${change.issue}`" target="_blank" rel="noopener noreferrer" :title="t('changelog.issue', { n: change.issue })">#{{ change.issue }}</a>
						</li>
					</ul>
				</section>
			</li>
		</ol>
	</BaseModal>
</template>

<style scoped>
.releases {
	display: grid;
	gap: 1rem;
	margin: 1rem 0 0;
	padding: 0;
	list-style: none;
}

.release {
	padding: 1rem 1.1rem;
	border: 2px solid color-mix(in srgb, var(--tint) 45%, var(--border));
	border-radius: var(--radius);
	background: color-mix(in srgb, var(--tint) 8%, var(--surface-2));
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--tint) 55%, black);
	animation: pop 0.3s ease-out backwards;
}

.release:nth-child(2) {
	animation-delay: 0.05s;
}

.release:nth-child(n + 3) {
	animation-delay: 0.1s;
}

.release-head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.bubble {
	display: grid;
	place-items: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 30%, var(--surface));
	font-size: 1.1rem;
}

.version {
	font-family: var(--font-mono);
	font-size: 1.15rem;
	font-weight: 700;
}

.latest {
	padding: 0.1rem 0.6rem;
	border-radius: 999px;
	background: var(--accent);
	color: var(--on-accent);
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.date {
	margin-left: auto;
	color: var(--text-muted);
	font-size: 0.85rem;
}

.section {
	--badge: var(--color-5);
	margin-top: 0.85rem;
}

.section.fix {
	--badge: var(--color-4);
}

.section.security {
	--badge: var(--color-1);
}

.section.perf {
	--badge: var(--color-3);
}

.section.style {
	--badge: var(--color-2);
}

.section.refactor {
	--badge: var(--color-6);
}

.section-title {
	display: inline-block;
	margin: 0;
	padding: 0.1rem 0.6rem;
	border: 1.5px solid var(--badge);
	border-radius: 999px;
	background: color-mix(in srgb, var(--badge) 22%, var(--surface));
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.changes {
	display: grid;
	gap: 0.35rem;
	margin: 0.5rem 0 0;
	padding: 0;
	list-style: none;
}

.changes li {
	position: relative;
	padding-left: 1.2rem;
	user-select: text;
}

.changes li::before {
	content: '';
	position: absolute;
	left: 0.2rem;
	top: 0.55em;
	width: 0.45rem;
	height: 0.45rem;
	border-radius: 50%;
	background: var(--badge);
}

.issue {
	margin-left: 0.35rem;
	padding: 0 0.4rem;
	border-radius: 0.4rem;
	background: color-mix(in srgb, var(--badge) 18%, var(--surface));
	color: var(--text);
	font-family: var(--font-mono);
	font-size: 0.8rem;
	font-weight: 700;
	text-decoration: none;
	white-space: nowrap;
}

.issue:hover,
.issue:focus-visible {
	background: var(--badge);
	color: var(--on-accent);
}

@keyframes pop {
	from {
		opacity: 0;
		transform: scale(0.95);
	}
}
</style>
