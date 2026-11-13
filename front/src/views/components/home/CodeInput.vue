<script setup lang="ts">
// One box per character; typing or pasting spreads across boxes, arrows/backspace move between them.
import { computed, ref } from 'vue';
import { t } from '@/i18n';

const props = defineProps<{ length: number }>();
const code = defineModel<string>({ required: true });

const chars = ref<string[]>(Array(props.length).fill(''));
const boxes = ref<HTMLInputElement[]>([]);
const placeholder = Array.from({ length: props.length }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]);
const joined = computed(() => chars.value.join(''));

const sync = (): void => {
	code.value = joined.value;
};

const focusBox = (index: number): void => {
	boxes.value[Math.max(0, Math.min(index, props.length - 1))]?.focus();
};

const onInput = (index: number, event: Event): void => {
	const input = event.target as HTMLInputElement;
	// Typing into a filled box without selection gives two chars: keep only the new one.
	const raw = chars.value[index] && input.value.length === 2 ? input.value.replace(chars.value[index], '') : input.value;
	const typed = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, props.length - index);
	if (!typed) {
		chars.value[index] = '';
		input.value = '';
		sync();

		return;
	}
	[...typed].forEach((char, offset) => (chars.value[index + offset] = char));
	input.value = chars.value[index];
	sync();
	focusBox(index + typed.length);
};

const onKeydown = (index: number, event: KeyboardEvent): void => {
	if (event.key === 'Backspace' && !chars.value[index] && index > 0) {
		event.preventDefault();
		chars.value[index - 1] = '';
		sync();
		focusBox(index - 1);
	} else if (event.key === 'ArrowLeft') {
		event.preventDefault();
		focusBox(index - 1);
	} else if (event.key === 'ArrowRight') {
		event.preventDefault();
		focusBox(index + 1);
	}
};
</script>

<template>
	<div class="code" role="group" :aria-label="t('home.codeLabel')">
		<input
			v-for="(char, charIndex) in chars"
			:key="charIndex"
			ref="boxes"
			:value="char"
			inputmode="text"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			:placeholder="placeholder[charIndex]"
			:aria-label="`${t('home.codeLabel')} ${charIndex + 1}/${length}`"
			@input="onInput(charIndex, $event)"
			@keydown="onKeydown(charIndex, $event)"
			@focus="($event.target as HTMLInputElement).select()"
		/>
	</div>
</template>

<style scoped>
.code {
	display: flex;
	flex: 1 1 100%;
	justify-content: center;
	gap: 0.5rem;
}

.code input {
	width: 3rem;
	min-width: 0;
	padding: 0.5rem 0;
	font-family: var(--font-mono);
	font-size: 1.6rem;
	font-weight: 700;
	text-align: center;
	text-transform: lowercase;
}
</style>
