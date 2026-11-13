import type { QuestionDraft, Run, RunPlayer } from '@/interfaces/Quiz/QuizInterface';

export interface StatTile {
	key: string;
	icon: string;
	color: string;
	label: string;
	info: string;
	value: string;
	unit?: string;
	ratio?: number | null;
}

export type AnswerMark = 'none' | 'good' | 'bad';

export interface PlayerRow {
	player: RunPlayer;
	run: Run;
	rank: number | null;
	correct: number;
	accuracy: string;
	avgTime: string;
	strip: AnswerMark[];
}

export interface SessionSummary {
	run: Run;
	best: RunPlayer | null;
	avg: number;
}

export interface QuestionStat {
	question: QuestionDraft;
	index: number;
	counts: number[];
	correctIndexes: number[];
	accuracy: string;
	avgTime: string;
	skipped: number;
	avgPoints: number;
}
