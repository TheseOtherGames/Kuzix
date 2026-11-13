import { auth, logout } from '@/features/auth/auth.store';
import { t } from '@/shared/i18n/i18n';

export class ApiError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

// Spam guard for every button: identical requests share one fetch while it runs, a failed GET is
// replayed for a few seconds (e.g. retrying a wrong join code), and a 429 pauses all calls until Retry-After.
const pending = new Map<string, Promise<unknown>>();
const FAILED_GET_REUSE_MS = 3000;
let blockedUntil = 0;

export const api = <T = void>(path: string, method = 'GET', body?: unknown): Promise<T> => {
	if (Date.now() < blockedUntil) {
		return Promise.reject(new ApiError(429, 'Too many requests, please slow down'));
	}
	const key = `${auth.token} ${method} ${path} ${body === undefined ? '' : JSON.stringify(body)}`;
	const existing = pending.get(key);
	if (existing) {
		return existing as Promise<T>;
	}
	const request = send<T>(path, method, body);
	pending.set(key, request);
	request.then(
		() => pending.delete(key),
		() => (method === 'GET' ? setTimeout(() => pending.delete(key), FAILED_GET_REUSE_MS) : pending.delete(key)),
	);

	return request;
};

const send = async <T>(path: string, method: string, body?: unknown): Promise<T> => {
	const headers: Record<string, string> = {};
	if (auth.token) {
		headers.Authorization = `Bearer ${auth.token}`;
	}
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	const response = await fetch(`/api${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		if (response.status === 429) {
			blockedUntil = Date.now() + (Number(response.headers.get('Retry-After')) || 10) * 1000;
		}
		// Banned mid-session: drop the token so the app falls back to the logged-out state.
		if (response.status === 403 && data.error === 'This account has been banned') {
			logout();
		}

		throw new ApiError(response.status, data.error ?? t('common.requestFailed', { status: response.status }));
	}

	return response.status === 204 ? (undefined as T) : response.json();
};
