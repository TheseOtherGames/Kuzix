import type { RevealMode } from '@/interfaces/Quiz/QuizInterface';

export type GamePhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'end';

// Present only during the `countdown` phase, before question `index` starts.
export interface CountdownState {
	index: number;
	remainingMs: number;
}

export interface PlayerPublic {
	id: number;
	nickname: string;
	avatar: string;
	score: number;
	rank: number;
	connected: boolean;
	answered: boolean;
}

export interface HostState {
	phase: GamePhase;
	paused: boolean;
	code: string | null;
	title: string;
	revealMode: RevealMode;
	countdownSeconds: number;
	countdown: CountdownState | null;
	questionsCount: number;
	players: PlayerPublic[];
	question: {
		index: number;
		text: string;
		timeLimit: number;
		difficulty: number;
		answers: string[];
		remainingMs: number;
		cancelled: boolean;
	} | null;
	reveal: {
		correct: number[];
		counts: number[];
	} | null;
}

export interface PlayerState {
	phase: GamePhase;
	paused: boolean;
	code: string | null;
	title: string;
	questionsCount: number;
	countdown: CountdownState | null;
	playersCount: number;
	hostConnected: boolean;
	playerToken: string;
	me: {
		nickname: string;
		avatar: string;
		score: number | null;
		rank: number | null;
	};
	question: {
		index: number;
		answersCount: number;
		timeLimit: number;
		remainingMs: number;
		cancelled: boolean;
	} | null;
	myAnswer: number | null;
	/** The closest player with a higher score, when scores are visible; null when leading. */
	ahead: {
		nickname: string;
		avatar: string;
		gap: number;
	} | null;
	result: {
		correct: boolean;
		points: number;
	} | null;
}

export type ClientMessage =
	| { type: 'host'; quizId: number; token: string }
	| { type: 'join'; code: string; nickname: string; avatar: string; token?: string }
	| { type: 'rejoin'; playerToken: string }
	| { type: 'next' }
	| { type: 'pause'; paused: boolean }
	| { type: 'settings'; revealMode: RevealMode; countdown: number }
	| { type: 'stop' }
	| { type: 'cancel-question' }
	| { type: 'profile'; nickname: string; avatar: string }
	| { type: 'kick'; playerId: number }
	| { type: 'answer'; index: number };

export type ServerMessage =
	| { type: 'host-state'; state: HostState }
	| { type: 'player-state'; state: PlayerState }
	| { type: 'closed' }
	| { type: 'kicked' }
	| { type: 'error'; message: string };
