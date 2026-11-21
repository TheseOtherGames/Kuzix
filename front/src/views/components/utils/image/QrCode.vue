<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import QRCode from 'qrcode';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';

const props = defineProps<{ value: string; label: string }>();

// Error correction H restores ~30% of the modules; the logo covers far less so scanning stays reliable.
const svg = ref('');
watchEffect(async () => {
	svg.value = await QRCode.toString(props.value, { type: 'svg', errorCorrectionLevel: 'H', margin: 1 });
});
</script>

<template>
	<div class="qr" role="img" :aria-label="label">
		<div v-html="svg" />
		<span class="qr-logo"><AppIcon name="logo" /></span>
	</div>
</template>

<style scoped>
/* Always dark on white, whatever the theme, so phones can scan it. Size it with a width from the parent. */
.qr {
	position: relative;
	width: fit-content;
	padding: 0.4rem;
	border-radius: var(--radius);
	background: white;
	box-shadow: 0 0.4rem 0 color-mix(in srgb, var(--border) 80%, black);
}

.qr :deep(svg) {
	display: block;
	width: 100%;
	height: auto;
}

/* ~13% of the code's width: small enough for H correction to rebuild what it hides. */
.qr-logo {
	--logo-outline: #a3204a;
	position: absolute;
	inset: 50% auto auto 50%;
	display: grid;
	place-items: center;
	width: 20%;
	aspect-ratio: 1;
	border-radius: 22%;
	background: white;
	transform: translate(-50%, -50%);
}

.qr-logo :deep(svg) {
	width: 100%;
	height: 100%;
}
</style>
