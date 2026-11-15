<script setup lang="ts">
// A quiz title anywhere in the admin: click to preview the quiz (deleted ones too, correct answers marked).
import { ref } from 'vue';
import BaseModal from '@/views/components/utils/modal/BaseModal.vue';
import QuizPreviewList from '@/views/components/library/QuizPreviewList.vue';
import { t } from '@/i18n';

defineProps<{ id: number; title: string }>();

const open = ref(false);
</script>

<template>
	<span class="quiz-link">
		<button type="button" :data-tip="t('admin.previewQuiz')" @click="open = true">{{ title }}</button>
		<BaseModal :open="open" :title="title" wide @close="open = false">
			<QuizPreviewList v-if="open" :url="`/admin/quizzes/${id}`" />
		</BaseModal>
	</span>
</template>

<style scoped>
/* Flex so the button can shrink (ellipsis) when a parent limits the width; in tables it sizes to its text. */
.quiz-link {
	display: inline-flex;
	min-width: 0;
}

button {
	min-width: 0;
	padding: 0.15rem 0.45rem;
	margin-left: -0.45rem;
	overflow: hidden;
	border: none;
	border-radius: 0.45rem;
	background: none;
	color: inherit;
	text-decoration: inherit;
	font: inherit;
	text-align: left;
	text-overflow: ellipsis;
	/* Wraps in tables, ellipsis where the parent sets nowrap (user modal lists). */
	white-space: inherit;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

button:hover,
button:focus-visible {
	background: color-mix(in srgb, var(--accent) 16%, transparent);
	color: var(--accent-text);
}
</style>
