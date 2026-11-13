export type RevealMode = 'question' | 'end';

export interface AnswerInput {
	text: string;
	isCorrect: boolean;
}

export interface QuestionInput {
	text: string;
	timeLimit: number;
	difficulty: number;
	answers: AnswerInput[];
}

export interface QuizInput {
	title: string;
	revealMode: RevealMode;
	countdown: number;
	questions: QuestionInput[];
}

export interface Answer extends AnswerInput {
	id: number;
}

export interface Question extends Omit<QuestionInput, 'answers'> {
	id: number;
	answers: Answer[];
}

export interface Quiz {
	id: number;
	code: string | null;
	ownerId: number;
	title: string;
	revealMode: RevealMode;
	countdown: number;
	questions: Question[];
}

export interface QuizDetail extends Quiz {
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
