<script setup lang="ts">
import { computed } from 'vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import UnitInput from '@/views/components/utils/form/UnitInput.vue';
import type { MessageKey } from '@/locales/en';
import { LOCALES, t } from '@/i18n';
import { buildAiPrompt, type AiPromptOptions } from '@/utils/AiPrompt';

const props = defineProps<{
	formId: string;
	maxQuestions: number;
}>();

const emit = defineEmits<{ submit: [] }>();
const ai = defineModel<AiPromptOptions>({ required: true });

const prompt = computed(() => buildAiPrompt(ai.value, props.maxQuestions));
</script>

<template>
	<ol class="steps">
		<li>{{ t('dash.ai.step1') }}</li>
		<li>{{ t('dash.ai.step2') }}</li>
		<li>{{ t('dash.ai.step3') }}</li>
	</ol>
	<form :id="formId" @submit.prevent="emit('submit')">
		<fieldset class="group">
			<legend>{{ t('dash.ai.groupContent') }}</legend>
			<div class="fields">
				<label class="wide">
					<span>{{ t('dash.ai.topic') }}<InfoTip :text="t('dash.ai.topicInfo')" /></span>
					<input v-model="ai.topic" required maxlength="200" :placeholder="t('dash.ai.topicPh')" />
				</label>
				<label>
					<span>{{ t('dash.ai.language') }}<InfoTip :text="t('dash.ai.languageInfo')" /></span>
					<select v-model="ai.language">
						<option v-for="option in LOCALES" :key="option.value" :value="option.value">{{ option.label }}</option>
					</select>
				</label>
				<label>
					<span>{{ t('dash.ai.difficulty') }}<InfoTip :text="t('dash.ai.difficultyInfo')" /></span>
					<select v-model.number="ai.difficulty">
						<option :value="0">{{ t('dash.ai.mixedOption') }}</option>
						<option v-for="level in 5" :key="level" :value="level">{{ level }} · {{ t(`q.level.${level}` as MessageKey) }}</option>
					</select>
				</label>
				<label class="wide">
					<span>{{ t('dash.ai.notes') }}<InfoTip :text="t('dash.ai.notesInfo')" /></span>
					<textarea v-model="ai.notes" rows="2" maxlength="500" :placeholder="t('dash.ai.notesPh')" />
				</label>
			</div>
		</fieldset>
		<fieldset class="group">
			<legend>{{ t('dash.ai.groupFormat') }}</legend>
			<div class="fields">
				<label>
					<span>{{ t('dash.ai.count') }}<InfoTip :text="t('dash.ai.countInfo')" /></span>
					<input v-model.number="ai.count" type="number" min="1" :max="maxQuestions" step="1" inputmode="numeric" />
				</label>
				<label>
					<span>{{ t('dash.ai.time') }}<InfoTip :text="t('dash.ai.timeInfo')" /></span>
					<UnitInput v-model.number="ai.time" unit="s" min="5" max="120" />
				</label>
				<label>
					<span>{{ t('dash.ai.answers') }}<InfoTip :text="t('dash.ai.answersInfo')" /></span>
					<input v-model.number="ai.answers" type="number" min="2" max="6" step="1" inputmode="numeric" />
				</label>
				<div class="range">
					<span>{{ t('dash.ai.correct') }}<InfoTip :text="t('dash.ai.correctInfo')" /></span>
					<span class="range-inputs">
						<input v-model.number="ai.correctMin" type="number" min="1" :max="ai.answers" step="1" inputmode="numeric" :aria-label="t('dash.ai.correctMin')" :placeholder="t('dash.ai.correctMin')" />
						<span aria-hidden="true">–</span>
						<input v-model.number="ai.correctMax" type="number" :min="ai.correctMin" :max="ai.answers" step="1" inputmode="numeric" :aria-label="t('dash.ai.correctMax')" :placeholder="t('dash.ai.correctMax')" />
					</span>
				</div>
			</div>
		</fieldset>
	</form>
	<details class="preview">
		<summary>{{ t('dash.ai.preview') }}</summary>
		<textarea class="prompt selectable" :value="prompt" readonly rows="10" :aria-label="t('dash.ai.preview')" />
	</details>
</template>

<style scoped>
.steps {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: 0 0 0.75rem;
	padding: 0;
	list-style: none;
	counter-reset: step;
}

.steps li {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.2rem 0.7rem 0.2rem 0.2rem;
	border-radius: 999px;
	background: var(--surface);
	font-size: 0.85rem;
	counter-increment: step;
}

.steps li::before {
	content: counter(step);
	display: grid;
	place-items: center;
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-color);
	font-weight: 700;
	font-size: 0.75rem;
}

.group {
	margin: 0;
	padding: 0.75rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
}

.group + .group {
	margin-top: 0.75rem;
}

.group legend {
	padding: 0 0.4rem;
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.range {
	font-weight: 500;
}

.range-inputs {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.range-inputs input {
	min-width: 0;
}

.fields {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	align-items: end;
	gap: 0.75rem;
}

.fields .wide {
	grid-column: 1 / -1;
}

.fields input,
.fields select,
.fields textarea {
	width: 100%;
}

.preview {
	margin-top: 0.75rem;
}

.preview summary {
	width: fit-content;
	padding: 0.25rem 0.75rem;
	border-radius: 999px;
	color: var(--accent-text);
	font-weight: 600;
	cursor: pointer;
}

.preview summary:hover {
	background: color-mix(in srgb, var(--color-5) 15%, transparent);
}

.prompt {
	width: 100%;
	margin-top: 0.5rem;
	font-family: var(--font-mono);
	font-size: 0.8rem;
	resize: vertical;
}
</style>
