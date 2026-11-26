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

export type Moderation = 'warned' | 'banned';

export interface Quiz extends QuizDraft {
	uid: string;
	code: string | null;
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

// Library preview hides the correct answers; the admin preview adds `correct` (answer indexes).
export interface QuizPreview {
	uid: string;
	title: string;
	owner: string;
	questions: { text: string; timeLimit: number; difficulty: number; answers: string[]; correct?: number[] }[];
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
