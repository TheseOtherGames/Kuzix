<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import Notice from '@/views/components/utils/text/Notice.vue';
import GameSettingsFields from '@/views/components/quiz/GameSettingsFields.vue';
import type { QuizDraft } from '@/interfaces/Quiz/QuizInterface';
import { t, tp } from '@/i18n';

defineProps<{
	isNew: boolean;
	maxQuestions: number;
	hasAnswers: boolean;
}>();

const quiz = defineModel<QuizDraft>({ required: true });
</script>

<template>
	<BaseCard accent="var(--accent)" class="meta">
		<h1>{{ isNew ? t('editor.new') : t('editor.edit') }}</h1>
		<label>
			{{ t('editor.title') }}<InfoTip :text="t('editor.titleInfo')" />
			<input v-model="quiz.title" maxlength="100" required :placeholder="t('editor.titlePh')" />
		</label>
		<GameSettingsFields v-model:reveal-mode="quiz.revealMode" v-model:countdown="quiz.countdown" />
		<p class="muted count">{{ tp('editor.count', quiz.questions.length) }} / {{ maxQuestions }}</p>
		<Notice v-if="hasAnswers" class="notice">{{ t('editor.playedNotice') }}</Notice>
	</BaseCard>
</template>

<style scoped>
.meta {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.meta h1 {
	margin: 0 0 0.25rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px dashed var(--border);
	font-size: clamp(1.5rem, 3vw, 2rem);
}

.count {
	margin: 0;
}

.notice {
	margin: 0;
}
</style>
