<script setup lang="ts">
// Unsaved changes on route leave: stay, discard, or save then go.
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import { t } from '@/i18n';

defineProps<{
	open: boolean;
	text: string;
	saving: boolean;
	wide?: boolean;
}>();

const emit = defineEmits<{ stay: []; discard: []; save: [] }>();
</script>

<template>
	<BaseModal :open="open" :title="t('pf.leaveTitle')" :wide="wide" @close="emit('stay')">
		<p>{{ text }}</p>
		<template #actions>
			<BaseButton variant="ghost" @click="emit('stay')">{{ t('pf.leaveStay') }}</BaseButton>
			<BaseButton variant="danger" @click="emit('discard')">{{ t('pf.leaveDiscard') }}</BaseButton>
			<BaseButton :loading="saving" @click="emit('save')"><AppIcon name="save" /> {{ t('pf.leaveSave') }}</BaseButton>
		</template>
	</BaseModal>
</template>
