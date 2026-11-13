import en from '../../../CHANGELOG.md?raw';
import fr from '../../../CHANGELOG.fr.md?raw';
import { computed } from 'vue';
import { locale } from '../shared/i18n/i18n';

export const CHANGE_TYPES = [
	'feat',
	'fix',
	'security',
	'perf',
	'style',
	'refactor',
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
export type Change = { text: string; issue?: number };
export type Section = { type: ChangeType; changes: Change[] };
export type Release = { version: string; date: string; sections: Section[] };

export const ISSUE_URL = 'https://github.com/TheseOtherGames/Kuzix/issues/';

// Line format: "[<type>] <text>" with an optional "(#<issue>)" at the end.
const LINE = /^(?:\[(\w+)\]\s*)?(.*?)(?:\s*\(#(\d+)\))?$/;

// Format: "## <version> - <date>" headings, each followed by "- " lines, grouped into sections in CHANGE_TYPES order.
const parse = (source: string): Release[] => source.split(/^## /m).slice(1).map((block) => {
	const [heading, ...lines] = block.split('\n');
	const [version, date = ''] = heading.split(' - ').map((part) => part.trim());
	const sections: Section[] = CHANGE_TYPES.map((type) => ({ type, changes: [] }));
	for (const line of lines.filter((entry) => entry.startsWith('- '))) {
		const [
			,
			code,
			text,
			issue,
		] = LINE.exec(line.slice(2).trim()) ?? [];
		const section = sections.find((entry) => entry.type === code) ?? sections[0];
		section.changes.push({ text, issue: issue ? Number(issue) : undefined });
	}

	return { version, date, sections: sections.filter((section) => section.changes.length) };
});

const SOURCES = { en: parse(en), fr: parse(fr) };

export const RELEASES = computed(() => SOURCES[locale.value]);

// The English file is the reference for the version number.
export const CURRENT_VERSION = SOURCES.en[0]?.version ?? '0.0.0';
