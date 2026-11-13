<script setup lang="ts">
// Labelled nickname field with its x/24 counter; extra attributes (autofocus, autocomplete…) go to the <input>.
defineOptions({ inheritAttrs: false });
defineProps<{ label: string }>();
const value = defineModel<string>({ required: true });

const MAX_LENGTH = 24;
</script>

<template>
	<label>
		{{ label }}
		<span class="char-count">{{ value.length }}/{{ MAX_LENGTH }}</span>
		<input v-model="value" :maxlength="MAX_LENGTH" required v-bind="$attrs" />
	</label>
</template>
