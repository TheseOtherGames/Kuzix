<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import FileDropZone from '@/views/components/utils/form/FileDropZone.vue';
import ImportBlock from '@/views/components/dashboard/ImportBlock.vue';
import AiPromptForm from '@/views/components/dashboard/AiPromptForm.vue';
import { t } from '@/i18n';
import { auth } from '@/utils/Auth';
import { copyText } from '@/utils/Clipboard';
import { buildAiPrompt, defaultAiPromptOptions } from '@/utils/AiPrompt';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; file: [file: File | undefined] }>();

const ai = ref(defaultAiPromptOptions());
const maxQuestions = (): number => auth.user?.limits.maxQuestions ?? 10;

const copyPrompt = (): Promise<boolean> => copyText(buildAiPrompt(ai.value, maxQuestions()), t('dash.promptCopied'));
</script>

<template>
	<BaseModal :open="open" :title="t('dash.importTitle')" wide @close="emit('close')">
		<ImportBlock icon="page" :title="t('dash.fileTitle')" :text="t('dash.importText')">
			<FileDropZone accept=".json,application/json" :label="t('dash.importFile')" :hint="t('dash.dropHint')" @file="emit('file', $event)" />
		</ImportBlock>
		<ImportBlock icon="sparkles" :title="t('dash.aiTitle')" :text="t('dash.aiText')">
			<AiPromptForm v-model="ai" form-id="ai-form" :max-questions="maxQuestions()" @submit="copyPrompt" />
		</ImportBlock>
		<template #actions>
			<BaseButton variant="ghost" @click="emit('close')">{{ t('common.close') }}</BaseButton>
			<BaseButton type="submit" form="ai-form" :disabled="!ai.topic.trim()"><AppIcon name="clipboard" /> {{ t('dash.copyPrompt') }}</BaseButton>
		</template>
	</BaseModal>
</template>
