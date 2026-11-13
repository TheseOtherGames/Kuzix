<script setup lang="ts">
// Usage: <FileDropZone accept=".json" :label :hint @file="(file) => …" />
import { ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

defineProps<{
	accept: string;
	label: string;
	hint: string;
}>();

const emit = defineEmits<{ file: [file: File | undefined] }>();

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);

const pick = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	target.value = '';
	emit('file', file);
};

const drop = (event: DragEvent): void => {
	dragging.value = false;
	emit('file', event.dataTransfer?.files[0]);
};
</script>

<template>
	<button
		type="button"
		class="file-zone"
		:class="{ dragging }"
		@click="input?.click()"
		@dragover.prevent="dragging = true"
		@dragleave="dragging = false"
		@drop.prevent="drop"
	>
		<strong><AppIcon name="upload" /> {{ label }}</strong>
		<span class="muted">{{ hint }}</span>
	</button>
	<input ref="input" type="file" :accept="accept" hidden @change="pick" />
</template>

<style scoped>
.file-zone {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.2rem;
	width: 100%;
	padding: 1rem;
	border: 2px dashed var(--accent-line);
	border-radius: var(--radius-sm);
	background: var(--surface);
	color: var(--text);
	font: inherit;
	cursor: pointer;
	transition: transform 0.15s, background 0.15s;
}

/* Children ignore the pointer so dragleave doesn't fire when crossing them. */
.file-zone > * {
	pointer-events: none;
}

.file-zone.dragging {
	border-style: solid;
}

.file-zone:hover,
.file-zone.dragging {
	transform: translateY(-0.15rem);
	background: color-mix(in srgb, var(--color-5) 10%, var(--surface));
}
</style>
