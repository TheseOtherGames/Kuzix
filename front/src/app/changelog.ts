import en from '../../../CHANGELOG.md?raw';
import fr from '../../../CHANGELOG.fr.md?raw';
import { computed } from 'vue';
import { locale } from '../shared/i18n/i18n';

export type Release = { version: string; date: string; changes: string[] };

// Format: "## <version> - <date>" headings, each followed by "- <change>" lines.
const parse = (source: string): Release[] => source.split(/^## /m).slice(1).map((block) => {
	const [heading, ...lines] = block.split('\n');
	const [version, date = ''] = heading.split(' - ').map((part) => part.trim());
	const changes = lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim());
	return { version, date, changes };
});

const SOURCES = { en: parse(en), fr: parse(fr) };

export const RELEASES = computed(() => SOURCES[locale.value]);

// The English file is the reference for the version number.
export const CURRENT_VERSION = SOURCES.en[0]?.version ?? '0.0.0';
