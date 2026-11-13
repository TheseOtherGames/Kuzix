import { ref, watchEffect } from 'vue';

export type Theme = 'system' | 'dark' | 'light';

const STORAGE_KEY = 'kuzix-theme';
const THEMES: Theme[] = ['system', 'dark', 'light'];
export const THEME_ICONS: Record<Theme, string> = { system: 'monitor', dark: 'moon', light: 'sun' };

const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
export const theme = ref<Theme>(stored && THEMES.includes(stored) ? stored : 'system');

const prefersLight = matchMedia('(prefers-color-scheme: light)');
const systemLight = ref(prefersLight.matches);
prefersLight.addEventListener('change', (event) => {
	systemLight.value = event.matches;
});

export const cycleTheme = (): void => {
	theme.value = THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length];
};

watchEffect(() => {
	const resolved = theme.value === 'system' ? (systemLight.value ? 'light' : 'dark') : theme.value;
	document.documentElement.dataset.theme = resolved;
	localStorage.setItem(STORAGE_KEY, theme.value);
});
