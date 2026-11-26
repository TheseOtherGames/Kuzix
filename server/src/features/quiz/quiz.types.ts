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

export type Moderation = 'warned' | 'banned';

export interface Quiz {
	id: number;
	uid: string;
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
	uid: string;
	code: string | null;
	title: string;
	isOpen: boolean;
	questionsCount: number;
	runsCount: number;
	createdAt: string;
	isPublic: boolean;
	moderation: Moderation | null;
	moderationReason: string | null;
	// Set on a copy of a library quiz.
	source: QuizSource | null;
}

export interface QuizSource {
	uid: string;
	title: string;
	owner: string;
	// False once the source is unpublished, deleted or banned: nothing to pull any more.
	available: boolean;
	updateAvailable: boolean;
}

export interface PublicQuiz {
	uid: string;
	title: string;
	owner: string;
	ownerAvatar: string;
	questionsCount: number;
	downloads: number;
	updatedAt: string;
	moderation: Moderation | null;
	isOwn: boolean;
	// The viewer has an open (not yet reviewed) report on it.
	reported: boolean;
}

// Read-only preview. Library: correct answers stay hidden so players can't look them up; admin: `correct` = answer indexes.
export interface QuizPreview {
	uid: string;
	title: string;
	owner: string;
	questions: { text: string; timeLimit: number; difficulty: number; answers: string[]; correct?: number[] }[];
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
