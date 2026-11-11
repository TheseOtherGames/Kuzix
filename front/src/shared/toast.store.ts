import { reactive } from 'vue';
import { translateServerError } from './i18n/i18n';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
}

const DURATION_MS = 4000;
let nextId = 1;

export const toasts = reactive<Toast[]>([]);

export const dismissToast = (id: number): void => {
	const index = toasts.findIndex((entry) => entry.id === id);
	if (index !== -1) {
		toasts.splice(index, 1);
	}
};

const push = (type: ToastType, message: string): void => {
	const id = nextId++;
	toasts.push({ id, type, message });
	setTimeout(() => dismissToast(id), DURATION_MS);
};

export const toast = {
	success: (message: string) => push('success', message),
	// Every server/socket error ends up here, so this is the one place to translate them.
	error: (message: string) => push('error', translateServerError(message)),
	info: (message: string) => push('info', message),
};
