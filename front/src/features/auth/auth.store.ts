import { reactive } from 'vue';
import type { AuthResponse, Profile, User } from './user.types';
import { api, ApiError } from '../../shared/api';
import { randomAvatar } from '../../shared/avatars';
import { t } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';

const TOKEN_KEY = 'kuzix-token';
const PENDING_CLAIM_KEY = 'kuzix-pending-claim';

export const auth = reactive({
	token: localStorage.getItem(TOKEN_KEY),
	user: null as User | null,
});

// Guest profile lives in memory only, it is lost when the page is left.
export const guestProfile = reactive<Profile>({
	nickname: '',
	avatar: randomAvatar(),
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

export const loginWithPassword = async (email: string, password: string): Promise<void> => {
	const response = await api<AuthResponse>('/auth/login', 'POST', { email, password });
	await login(response.token, response.user);
};

export const register = async (email: string, password: string, username: string): Promise<void> => {
	const response = await api<AuthResponse>('/auth/register', 'POST', { email, password, username });
	await login(response.token, response.user);
};

export const updateProfile = async (profile: Profile): Promise<void> => {
	auth.user = await api<User>('/users/me', 'PATCH', { username: profile.nickname, avatar: profile.avatar });
};
