export const MAX_TITLE_LENGTH = 100;

const NUMBER_SUFFIX = / \((\d+)\)$/;

// "Quiz" taken → "Quiz (2)"; duplicating "Quiz (2)" → "Quiz (3)". Gaps left by deleted quizzes are reused.
export const uniqueTitle = (title: string, taken: string[]): string => {
	const used = new Set(taken);
	if (!used.has(title)) {
		return title;
	}
	const base = title.replace(NUMBER_SUFFIX, '');
	for (let n = 2; ; n++) {
		const suffix = ` (${n})`;
		const candidate = base.slice(0, MAX_TITLE_LENGTH - suffix.length) + suffix;
		if (!used.has(candidate)) {
			return candidate;
		}
	}
};
