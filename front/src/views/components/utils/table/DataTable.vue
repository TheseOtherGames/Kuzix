<script setup lang="ts">
// Usage: <DataTable><thead>…</thead><tbody>…</tbody></DataTable>. Scrolls sideways on narrow screens.
// Cells can use .num (right-aligned figures) and .nowrap.
</script>

<template>
	<div class="table-scroll">
		<table>
			<slot />
		</table>
	</div>
</template>

<style scoped>
.table-scroll {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
}

table :deep(th) {
	padding: 0.4rem 0.6rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	text-align: left;
	text-transform: uppercase;
	white-space: nowrap;
}

table :deep(td) {
	padding: 0.5rem 0.6rem;
	border-top: 1px solid var(--border);
	vertical-align: middle;
}

table :deep(.num) {
	text-align: right;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

table :deep(.nowrap) {
	white-space: nowrap;
}
</style>
