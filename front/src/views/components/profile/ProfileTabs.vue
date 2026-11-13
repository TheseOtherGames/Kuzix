<script setup lang="ts" generic="T extends string">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import { t } from '@/i18n';

const props = defineProps<{
	tabs: { value: T; label: string; icon: string }[];
	active: T;
	// Tab that shows the unsaved-changes dot.
	dirtyTab?: T | null;
}>();

const emit = defineEmits<{ select: [value: T] }>();

// WAI-ARIA tabs: arrow keys move between tabs.
const onKey = (event: KeyboardEvent): void => {
	const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
	if (!offset) {
		return;
	}
	const index = (props.tabs.findIndex((entry) => entry.value === props.active) + offset + props.tabs.length) % props.tabs.length;
	emit('select', props.tabs[index].value);
	document.getElementById(`tab-${props.tabs[index].value}`)?.focus();
};
</script>

<template>
	<div class="tabs" role="tablist" @keydown="onKey">
		<button
			v-for="entry in tabs"
			:id="`tab-${entry.value}`"
			:key="entry.value"
			type="button"
			role="tab"
			class="tab"
			:aria-selected="active === entry.value"
			:aria-controls="`panel-${entry.value}`"
			:tabindex="active === entry.value ? 0 : -1"
			@click="emit('select', entry.value)"
		>
			<AppIcon :name="entry.icon" />{{ entry.label }}
			<span v-if="entry.value === dirtyTab" class="tab-dot" :title="t('pf.unsaved')" aria-hidden="true"></span>
		</button>
	</div>
</template>

<style scoped>
.tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	width: fit-content;
	max-width: 100%;
	padding: 0.35rem;
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow);
}

.tab {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 1.1rem;
	border: none;
	border-radius: 999px;
	background: none;
	color: var(--text-muted);
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.tab:hover {
	background: var(--surface-2);
	color: var(--text);
}

.tab[aria-selected='true'] {
	background: var(--accent);
	color: var(--on-accent);
	box-shadow: 0 0.2rem 0 color-mix(in srgb, var(--accent) 55%, black);
}

.tab-dot {
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	background: var(--color-3);
	box-shadow: 0 0 0 2px var(--surface);
}

@media (max-width: 480px) {
	.tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: 100%;
		border-radius: var(--radius);
	}

	.tab {
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.45rem 0.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
	}
}
</style>
