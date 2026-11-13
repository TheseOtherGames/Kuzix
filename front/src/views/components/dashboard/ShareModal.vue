<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import { t } from '@/i18n';
import { copyText } from '@/utils/Clipboard';

const props = defineProps<{ code: string | null }>();
const emit = defineEmits<{ close: [] }>();

const link = computed(() => (props.code ? `${location.origin}/play/${props.code}` : ''));

const copyLink = (): Promise<boolean> => copyText(link.value, t('dash.linkCopied'));
</script>

<template>
	<BaseModal :open="Boolean(code)" :title="t('dash.shareTitle')" @close="emit('close')">
		<p class="muted">{{ t('dash.shareCode') }}</p>
		<p class="big-code selectable">{{ code }}</p>
		<input :value="link" readonly :aria-label="t('dash.shareLink')" @focus="($event.target as HTMLInputElement).select()" />
		<template #actions>
			<BaseButton variant="ghost" @click="emit('close')">{{ t('common.close') }}</BaseButton>
			<BaseButton @click="copyLink">{{ t('dash.copyLink') }}</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.big-code {
	width: fit-content;
	margin: 0.5rem auto 1rem;
	padding: 0.3rem 1.2rem;
	border-radius: var(--radius);
	background: var(--color-3);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--color-3) 55%, black);
	color: #1e2230;
	font-family: var(--font-mono);
	font-size: clamp(2rem, 9vw, 3rem);
	font-weight: 700;
	letter-spacing: 0.12em;
	text-align: center;
}
</style>
