export type RevealMode = 'question' | 'end';

export interface AnswerDraft {
	text: string;
	isCorrect: boolean;
}

export interface QuestionDraft {
	text: string;
	timeLimit: number;
	difficulty: number;
	answers: AnswerDraft[];
}

export interface QuizDraft {
	title: string;
	revealMode: RevealMode;
	countdown: number;
	questions: QuestionDraft[];
}

export interface Quiz extends QuizDraft {
	id: number;
	code: string;
	hasAnswers: boolean;
}

export interface QuizSummary {
	id: number;
	code: string;
	title: string;
	isOpen: boolean;
	questionsCount: number;
	runsCount: number;
	createdAt: string;
}

export interface RunPlayer {
	id: number;
	nickname: string;
	avatar: string;
	score: number;
	rank: number | null;
	registered: boolean;
}

export interface Run {
	id: number;
	startedAt: string;
	endedAt: string | null;
	players: RunPlayer[];
}

export interface PlayerAnswerDetail {
	question: string;
	answer: string | null;
	isCorrect: boolean;
	points: number;
	maxPoints: number;
	timeMs: number | null;
	timeLimit: number;
	correctAnswer: string;
}
