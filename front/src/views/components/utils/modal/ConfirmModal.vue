<script setup lang="ts">
// Usage: <ConfirmModal :open :title :confirm-label icon="trash" @close @confirm><p>…</p></ConfirmModal>
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import { t } from '@/i18n';

defineProps<{
	open: boolean;
	title: string;
	confirmLabel: string;
	icon?: string;
	loading?: boolean;
}>();

const emit = defineEmits<{ close: []; confirm: [] }>();
</script>

<template>
	<BaseModal :open="open" :title="title" @close="emit('close')">
		<slot />
		<template #actions>
			<BaseButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</BaseButton>
			<BaseButton variant="danger" :loading="loading" @click="emit('confirm')"><AppIcon v-if="icon" :name="icon" /> {{ confirmLabel }}</BaseButton>
		</template>
	</BaseModal>
</template>
