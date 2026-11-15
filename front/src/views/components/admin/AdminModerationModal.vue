<script setup lang="ts">
// Warn, ban or lift (kind null) a quiz. Shared by the Quizzes and Reports admin pages; moderating also resolves the quiz's open reports.
import { ref, watch } from 'vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import type { Moderation } from '@/interfaces/Quiz/QuizInterface';
import { api } from '@/utils/API';
import { t } from '@/i18n';
import { toast } from '@/utils/Toast';

export interface ModerationTarget {
	quiz: { id: number; title: string };
	kind: Moderation | null;
}

const props = defineProps<{ target: ModerationTarget | null }>();
const emit = defineEmits<{ close: []; done: [] }>();

const reason = ref('');
const saving = ref(false);

watch(() => props.target, () => {
	reason.value = '';
});

const moderate = async (): Promise<void> => {
	const { quiz, kind } = props.target!;
	saving.value = true;
	try {
		if (kind) {
			await api(`/admin/quizzes/${quiz.id}/moderation`, 'POST', { kind, reason: reason.value });
		} else {
			await api(`/admin/quizzes/${quiz.id}/moderation`, 'DELETE');
		}
		toast.success(t(kind ? `admin.mod.${kind}Done` : 'admin.mod.clearDone', { title: quiz.title }));
		emit('done');
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<BaseModal
		:open="Boolean(target)"
		:title="t(target?.kind ? `admin.mod.${target.kind}Title` : 'admin.mod.clearTitle', { title: target?.quiz.title ?? '' })"
		@close="emit('close')"
	>
		<p>{{ t(target?.kind ? `admin.mod.${target.kind}Text` : 'admin.mod.clearText') }}</p>
		<label v-if="target?.kind" class="reason">
			<span>{{ t('admin.mod.reason') }}</span>
			<textarea v-model="reason" rows="3" maxlength="300"></textarea>
		</label>
		<template #actions>
			<BaseButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</BaseButton>
			<BaseButton :variant="target?.kind ? 'danger' : 'success'" :loading="saving" @click="moderate">
				{{ t(target?.kind === 'banned' ? 'admin.mod.ban' : target?.kind ? 'admin.mod.warn' : 'admin.mod.clear') }}
			</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.reason {
	display: grid;
	gap: 0.35rem;
	font-weight: 600;
}
</style>
