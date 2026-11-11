import { ref, watchEffect } from 'vue';
import { en, type MessageKey } from './en';
import { fr, frServerErrors } from './fr';

export type Locale = 'en' | 'fr';
type Params = Record<string, string | number>;
type PluralBase = MessageKey extends infer K ? (K extends `${infer B}.one` ? B : never) : never;

const STORAGE_KEY = 'kuzix-locale';
const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, fr };

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
	{ value: 'en', label: 'English', flag: 'flag-gb' },
	{ value: 'fr', label: 'Français', flag: 'flag-fr' },
];

const stored = localStorage.getItem(STORAGE_KEY);
export const locale = ref<Locale>(stored === 'en' || stored === 'fr' ? stored : navigator.language.startsWith('fr') ? 'fr' : 'en');

watchEffect(() => {
	document.documentElement.lang = locale.value;
	localStorage.setItem(STORAGE_KEY, locale.value);
});

export const t = (key: MessageKey, params: Params = {}): string => {
	return MESSAGES[locale.value][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''));
};

// French puts 0 in "one", English in "other": Intl.PluralRules knows that.
export const tp = (base: PluralBase, n: number, params: Params = {}): string => {
	const form = new Intl.PluralRules(locale.value).select(n) === 'one' ? 'one' : 'other';
	return t(`${base}.${form}` as MessageKey, { n, ...params });
};

// Server messages are English; "Question 3: <detail>" is the only parameterised shape.
export const translateServerError = (message: string): string => {
	if (locale.value === 'en') {
		return message;
	}
	const question = /^Question (\d+): (.+)$/.exec(message);
	if (question) {
		return `${t('q.title', { n: question[1] })} : ${frServerErrors[question[2]] ?? question[2]}`;
	}
	return frServerErrors[message] ?? message;
};
