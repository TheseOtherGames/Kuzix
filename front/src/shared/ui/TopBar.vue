<template>
	<header class="top-bar">
		<div class="bar">
			<slot />
		</div>
	</header>
</template>

<style scoped>
.top-bar {
	position: sticky;
	top: 0;
	z-index: 50;
	height: var(--header-height);
	padding: 0.6rem clamp(0.5rem, 2vw, 1.25rem) 0.4rem;
}

.bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	width: min(100%, 74rem);
	height: 100%;
	margin: 0 auto;
	padding: 0 0.45rem 0 1.25rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: color-mix(in srgb, var(--surface) 78%, transparent);
	backdrop-filter: blur(14px) saturate(1.4);
	box-shadow: var(--shadow);
}

@media (max-width: 640px) {
	.bar {
		padding-left: 1rem;
	}
}
</style>
