import { auth } from '../features/auth/auth.store';
import { t } from './i18n/i18n';

export class ApiError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

export const api = async <T = void>(path: string, method = 'GET', body?: unknown): Promise<T> => {
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
		throw new ApiError(response.status, data.error ?? t('common.requestFailed', { status: response.status }));
	}
	return response.status === 204 ? (undefined as T) : response.json();
};
