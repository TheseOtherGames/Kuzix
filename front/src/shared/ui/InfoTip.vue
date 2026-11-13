<script setup lang="ts">
import { ref, useId } from 'vue';
import { t } from '@/shared/i18n/i18n';

defineProps<{ text: string }>();

const MARGIN_PX = 8;
const id = useId();
const icon = ref<HTMLElement | null>(null);
const bubble = ref<HTMLElement | null>(null);

// The bubble is a popover: it lives in the top layer, so no scrolling container (modal, panel) can clip it
// or grow a scrollbar because of it. We place it next to the icon and keep it inside the viewport.
const show = (): void => {
	const el = bubble.value;
	if (!el || !icon.value || el.matches(':popover-open')) {
		return;
	}
	el.showPopover();
	const anchor = icon.value.getBoundingClientRect();
	const box = el.getBoundingClientRect();
	const left = Math.min(Math.max(MARGIN_PX, anchor.left - MARGIN_PX), innerWidth - box.width - MARGIN_PX);
	const below = anchor.bottom + MARGIN_PX;
	const top = below + box.height > innerHeight - MARGIN_PX ? anchor.top - box.height - MARGIN_PX : below;
	el.style.left = `${Math.max(MARGIN_PX, left)}px`;
	el.style.top = `${Math.max(MARGIN_PX, top)}px`;
};

const hide = (): void => {
	if (bubble.value?.matches(':popover-open')) {
		bubble.value.hidePopover();
	}
};
</script>

<template>
	<!-- A span, not a button: inside a <label> a button would steal the label from its input.
	     click.prevent stops the label from focusing its input when the icon is tapped. -->
	<span class="info-tip" @mouseenter="show" @mouseleave="hide">
		<span
			ref="icon"
			class="icon"
			role="button"
			tabindex="0"
			:aria-label="t('common.moreInfo')"
			:aria-describedby="id"
			@click.prevent="show"
			@focus="show"
			@blur="hide"
			@keydown.esc="hide"
		>i</span>
		<span :id="id" ref="bubble" popover="manual" role="tooltip" class="bubble">{{ text }}</span>
	</span>
</template>

<style scoped>
.info-tip {
	display: inline-flex;
	vertical-align: middle;
	margin-left: 0.35rem;
}

.icon {
	display: grid;
	place-items: center;
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 50%;
	background: var(--surface-2);
	box-shadow: inset 0 0 0 2px var(--border);
	color: var(--text-muted);
	font-size: 0.8rem;
	font-style: italic;
	font-weight: 700;
	line-height: 1;
	cursor: help;
	transition: background 0.15s, color 0.15s, transform 0.15s;
}

.info-tip:hover .icon,
.icon:focus-visible {
	background: var(--color-2);
	color: var(--on-color);
	transform: scale(1.15);
}

/* Reset the UA popover box (centred, bordered) and style it as a tooltip. */
.bubble {
	position: fixed;
	inset: auto;
	width: max-content;
	max-width: min(18rem, calc(100vw - 1rem));
	margin: 0;
	padding: 0.6rem 0.8rem;
	border: none;
	border-radius: var(--radius-sm);
	background: var(--text);
	color: var(--bg);
	box-shadow: var(--shadow);
	font-size: 0.85rem;
	font-style: normal;
	font-weight: 400;
	line-height: 1.4;
	letter-spacing: normal;
	text-transform: none;
	pointer-events: none;
}

.bubble:popover-open {
	animation: tip-in 0.15s ease-out;
}

@keyframes tip-in {
	from {
		opacity: 0;
		transform: translateY(-0.25rem);
	}
}
</style>
