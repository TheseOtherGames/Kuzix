import { config } from '../../core/config';
import type { OAuthProvider } from '../user/user.types';

const getJson = async <T>(url: string, accessToken: string): Promise<T> => {
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'kuzix' },
	});
	if (!response.ok) {
		throw new Error(`OAuth profile request failed: ${response.status}`);
	}

	return response.json() as Promise<T>;
};

const google: OAuthProvider = {
	authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	scope: 'openid email profile',
	...config.oauth.google,
	fetchProfile: async (accessToken) => {
		const data = await getJson<{ sub: string; email?: string; email_verified?: boolean; name?: string }>(
			'https://openidconnect.googleapis.com/v1/userinfo',
			accessToken,
		);

		return {
			id: data.sub,
			email: data.email_verified ? data.email ?? null : null,
			username: data.name ?? 'Player',
		};
	},
};

const github: OAuthProvider = {
	authorizeUrl: 'https://github.com/login/oauth/authorize',
	tokenUrl: 'https://github.com/login/oauth/access_token',
	scope: 'read:user user:email',
	...config.oauth.github,
	fetchProfile: async (accessToken) => {
		const user = await getJson<{ id: number; login: string; name: string | null }>('https://api.github.com/user', accessToken);
		const emails = await getJson<{ email: string; primary: boolean; verified: boolean }[]>(
			'https://api.github.com/user/emails',
			accessToken,
		);
		const primary = emails.find((entry) => entry.primary && entry.verified);

		return {
			id: String(user.id),
			email: primary?.email ?? null,
			username: user.name ?? user.login,
		};
	},
};

// Add new providers here; only those with credentials are enabled.
const providers: Record<string, OAuthProvider> = { google, github };

export const getProvider = (name: string): OAuthProvider | null => {
	const provider = providers[name];

	return provider?.clientId ? provider : null;
};

export const enabledProviders = (): string[] => {
	return Object.keys(providers).filter((name) => getProvider(name));
};

export const exchangeCode = async (provider: OAuthProvider, code: string, redirectUri: string): Promise<string> => {
	const response = await fetch(provider.tokenUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
		body: new URLSearchParams({
			client_id: provider.clientId,
			client_secret: provider.clientSecret,
			code,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
		}),
	});
	const data = await response.json() as { access_token?: string };
	if (!data.access_token) {
		throw new Error('OAuth token exchange failed');
	}

	return data.access_token;
};
