<script setup lang="ts">
import AnswerTile, { type AnswerTileState } from './AnswerTile.vue';

const props = defineProps<{
	count: number;
	texts?: string[];
	selected?: number | null;
	correct?: number[] | null;
	counts?: number[] | null;
	disabled?: boolean;
}>();

const emit = defineEmits<{ select: [index: number] }>();

const stateOf = (index: number): AnswerTileState => {
	if (props.correct) {
		if (props.correct.includes(index)) {
			return 'correct';
		}

		return props.selected === index ? 'wrong' : 'dimmed';
	}
	if (props.selected === undefined || props.selected === null) {
		return 'idle';
	}

	return props.selected === index ? 'selected' : 'dimmed';
};
</script>

<template>
	<div class="grid" :class="{ 'symbols-only': !texts }">
		<AnswerTile
			v-for="index in count"
			:key="index"
			:index="index - 1"
			:text="texts?.[index - 1]"
			:state="stateOf(index - 1)"
			:count="counts?.[index - 1]"
			:disabled="disabled"
			@select="emit('select', $event)"
		/>
	</div>
</template>

<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
	gap: 1rem;
}

.symbols-only {
	grid-template-columns: repeat(2, 1fr);
	grid-auto-rows: minmax(7rem, 1fr);
	height: 100%;
}
</style>
