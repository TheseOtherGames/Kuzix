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
	code: string | null;
	hasAnswers: boolean;
}

export interface QuizSummary {
	id: number;
	code: string | null;
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
	answers: RunAnswer[];
}

// One answer given by a player; question and answer are 0-based positions in the quiz.
export interface RunAnswer {
	question: number;
	answer: number;
	timeMs: number;
	points: number;
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
