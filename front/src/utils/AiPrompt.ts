import type { QuizDraft } from '@/interfaces/Quiz/QuizInterface';
import type { MessageKey } from '@/locales/en';
import { locale, t, tp } from '@/i18n';

export type AiPromptOptions = {
	topic: string;
	count: number;
	answers: number;
	correctMin: number;
	correctMax: number;
	time: number;
	difficulty: number;
	language: string;
	notes: string;
};

export const defaultAiPromptOptions = (): AiPromptOptions => ({
	topic: '', count: 10, answers: 4, correctMin: 1, correctMax: 1, time: 20, difficulty: 0, language: locale.value, notes: '',
});

// The JSON example is kept out of i18n: its braces would be read as {params}.
const EXAMPLE: QuizDraft = {
	title: 'Quiz title',
	revealMode: 'question',
	countdown: 3,
	questions: [
		{
			text: 'Question text?',
			timeLimit: 20,
			difficulty: 2,
			answers: [{ text: 'Right answer', isCorrect: true }, { text: 'Wrong answer', isCorrect: false }],
		},
	],
};

const clamp = (value: number, min: number, max: number, fallback: number): number =>
	Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

// The form fills the {params}; the rules stay in sync with the server's parseQuizInput.
export const buildAiPrompt = (ai: AiPromptOptions, maxQuestions: number): string => {
	const answers = clamp(ai.answers, 2, 6, 4);
	const correctMin = clamp(ai.correctMin, 1, answers, 1);
	const correctMax = clamp(ai.correctMax, correctMin, answers, correctMin);
	const prompt = t('dash.aiPrompt', {
		topic: ai.topic.trim() || '[?]',
		count: clamp(ai.count, 1, maxQuestions, 10),
		answers,
		correct: correctMin === correctMax
			? tp('dash.ai.correctExact', correctMin)
			: t('dash.ai.correctRange', { min: correctMin, max: correctMax }),
		time: clamp(ai.time, 5, 120, 20),
		difficulty: ai.difficulty ? `${ai.difficulty} (${t(`q.level.${ai.difficulty}` as MessageKey)})` : t('dash.ai.mixed'),
		language: t(`dash.ai.lang.${ai.language}` as MessageKey),
	});
	const notes = ai.notes.trim() ? `\n${t('dash.ai.notesLine', { notes: ai.notes.trim() })}` : '';

	return `${prompt}${notes}\n\n${JSON.stringify(EXAMPLE, null, 2)}`;
};
