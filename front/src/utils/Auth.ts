import { reactive } from 'vue';
import type { AuthResponse, ConfirmationResponse, Profile, User } from '@/interfaces/User/UserInterface';
import { api, ApiError } from '@/utils/API';
import { randomBase } from '@/utils/Avatars';
import { locale, t } from '@/i18n';
import { toast } from '@/utils/Toast';

const TOKEN_KEY = 'kuzix-token';
const PENDING_CLAIM_KEY = 'kuzix-pending-claim';
const OAUTH_STARTED_KEY = 'kuzix-oauth-started';

export const auth = reactive({
	token: localStorage.getItem(TOKEN_KEY),
	user: null as User | null,
});

// Guest profile lives in memory only, it is lost when the page is left.
export const guestProfile = reactive<Profile>({
	nickname: '',
	avatar: randomBase(),
});

export const currentProfile = (): Profile => {
	return auth.user ? { nickname: auth.user.username, avatar: auth.user.avatar } : { ...guestProfile };
};

export const setPendingClaim = (playerToken: string): void => {
	sessionStorage.setItem(PENDING_CLAIM_KEY, playerToken);
};

const claimPendingScore = async (): Promise<void> => {
	const playerToken = sessionStorage.getItem(PENDING_CLAIM_KEY);
	if (!playerToken) {
		return;
	}
	sessionStorage.removeItem(PENDING_CLAIM_KEY);
	try {
		await api('/users/me/claim', 'POST', { playerToken });
		toast.success(t('auth.scoreSaved'));
	} catch (error) {
		toast.error((error as Error).message);
	}
};

// The callback only trusts a token when this tab started the social login: a crafted
// /auth/callback#token=… link would otherwise log the visitor into someone else's account.
export const startOAuth = (): void => {
	sessionStorage.setItem(OAUTH_STARTED_KEY, '1');
};

export const consumeOAuth = (): boolean => {
	const started = sessionStorage.getItem(OAUTH_STARTED_KEY) !== null;
	sessionStorage.removeItem(OAUTH_STARTED_KEY);

	return started;
};

export const PROVIDER_LABELS: Record<string, string> = { google: 'Google', github: 'GitHub' };

export const logout = (): void => {
	auth.token = null;
	auth.user = null;
	localStorage.removeItem(TOKEN_KEY);
};

export const loadUser = async (): Promise<void> => {
	if (!auth.token) {
		return;
	}
	try {
		auth.user = await api<User>('/users/me');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			logout();
			toast.info(t('auth.expired'));
		} else if (error instanceof ApiError && error.status === 403) {
			toast.error(error.message);
		}
	}
};

export const login = async (token: string, user?: User): Promise<void> => {
	auth.token = token;
	localStorage.setItem(TOKEN_KEY, token);
	if (user) {
		auth.user = user;
	} else {
		await loadUser();
	}
	await claimPendingScore();
};

// locale: language of the confirmation email, when the server sends one.
export const loginWithPassword = async (email: string, password: string): Promise<void> => {
	const response = await api<AuthResponse>('/auth/login', 'POST', { email, password, locale: locale.value });
	await login(response.token, response.user);
};

// False when the account waits for its email confirmation (the server has SMTP set up).
export const register = async (email: string, password: string, username: string): Promise<boolean> => {
	const response = await api<AuthResponse | ConfirmationResponse>('/auth/register', 'POST', {
		email, password, username, locale: locale.value,
	});
	if ('confirmationSent' in response) {
		return false;
	}
	await login(response.token, response.user);

	return true;
};

export const updateProfile = async (profile: Profile): Promise<void> => {
	auth.user = await api<User>('/users/me', 'PATCH', { username: profile.nickname, avatar: profile.avatar });
};
