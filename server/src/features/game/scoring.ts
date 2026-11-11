export const POINTS_PER_DIFFICULTY = 200;

// Full points for an instant answer, half points at the buzzer.
export const computePoints = (difficulty: number, elapsedMs: number, timeLimitS: number): number => {
	const ratio = Math.min(Math.max(elapsedMs / (timeLimitS * 1000), 0), 1);
	return Math.round(difficulty * POINTS_PER_DIFFICULTY * (1 - ratio / 2));
};

// Competition ranking: equal scores share a rank (1, 2, 2, 4).
export const computeRanks = (scores: number[]): number[] => {
	return scores.map((score) => 1 + scores.filter((other) => other > score).length);
};
