<script setup lang="ts">
import type { MessageKey } from '@/shared/i18n/en';
import { computed } from 'vue';
import { ANSWER_COLORS, ANSWER_ICONS } from '@/shared/answers';
import { t } from '@/shared/i18n/i18n';
import AppIcon from '@/shared/ui/AppIcon.vue';

export type AnswerTileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

const props = defineProps<{
	index: number;
	text?: string;
	state?: AnswerTileState;
	count?: number;
	disabled?: boolean;
}>();

const emit = defineEmits<{ select: [index: number] }>();

const label = computed(() => props.text ?? t(`shape.${props.index}` as MessageKey));
</script>

<template>
	<button
		type="button"
		class="tile"
		:class="[state ?? 'idle', { 'symbol-only': !text }]"
		:style="{ '--tile-color': ANSWER_COLORS[index] }"
		:disabled="disabled"
		:aria-label="label"
		@click="emit('select', index)"
	>
		<span class="symbol"><AppIcon :name="ANSWER_ICONS[index]" /></span>
		<span v-if="text" class="text">{{ text }}</span>
		<span v-if="count !== undefined" class="count">{{ count }}</span>
		<AppIcon v-if="state === 'correct'" class="mark" name="check" />
		<AppIcon v-else-if="state === 'wrong'" class="mark" name="cross" />
	</button>
</template>

<style scoped>
.tile {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.9rem;
	min-height: 4.5rem;
	padding: 0.9rem 1.2rem;
	border: none;
	border-radius: var(--radius);
	background: var(--tile-color);
	color: var(--on-color);
	text-align: left;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--tile-color) 55%, black);
	cursor: pointer;
	transition: transform 0.12s, opacity 0.2s, filter 0.2s;
}

.tile:enabled:hover {
	transform: translateY(-0.15rem);
}

.tile:enabled:active {
	transform: translateY(0.25rem);
	box-shadow: 0 0.1rem 0 color-mix(in srgb, var(--tile-color) 55%, black);
}

.tile:disabled {
	cursor: default;
}

.symbol {
	font-size: 1.75rem;
	line-height: 1;
}

.text {
	flex: 1;
	font-size: clamp(1rem, 2.2vw, 1.4rem);
	font-weight: 600;
	overflow-wrap: anywhere;
}

.symbol-only {
	justify-content: center;
	min-height: 0;
	height: 100%;
}

.symbol-only .symbol {
	font-size: clamp(3rem, 14vw, 6rem);
}

.count {
	padding: 0.1rem 0.7rem;
	border-radius: 999px;
	background: rgba(0, 0, 0, 0.25);
	font-weight: 700;
}

.mark {
	position: absolute;
	top: 0.4rem;
	right: 0.6rem;
	font-size: 1.4rem;
}

.selected {
	outline: 0.3rem solid var(--text);
	outline-offset: 0.2rem;
}

.correct {
	animation: bounce 0.5s ease-out;
}

.wrong,
.dimmed {
	opacity: 0.55;
	filter: grayscale(0.5);
}

@keyframes bounce {
	40% {
		transform: scale(1.05);
	}
}
</style>
