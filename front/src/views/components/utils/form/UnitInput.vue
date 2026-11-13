<script setup lang="ts">
// Usage: <UnitInput v-model.number="seconds" unit="s" min="0" max="10" />; extra attributes go to the <input>.
defineOptions({ inheritAttrs: false });
defineProps<{ unit: string }>();
const value = defineModel<number | string>();
</script>

<template>
	<span class="with-unit">
		<input v-model="value" type="number" step="1" inputmode="numeric" v-bind="$attrs" />
		<span class="unit" aria-hidden="true">{{ unit }}</span>
	</span>
</template>

<style scoped>
.with-unit {
	position: relative;
	display: block;
}

.with-unit input {
	width: 100%;
	padding-right: 2rem;
}

.unit {
	position: absolute;
	top: 50%;
	right: 0.9rem;
	color: var(--text-muted);
	transform: translateY(-50%);
	pointer-events: none;
}
</style>
