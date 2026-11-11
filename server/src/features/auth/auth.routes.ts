import { Router } from 'express';
import { config } from '../../core/config';
import { hashPassword, randomToken, signToken, verifyPassword } from './auth.service';
import { assert, HttpError, isUniqueViolation } from '../../core/httpError';
import { enabledProviders, exchangeCode, getProvider } from './oauth.providers';
import { cleanUsername, createUser, findOrCreateOAuthUser, findUserWithPassword } from '../user/user.service';

const STATE_COOKIE = 'oauth_state';

const cleanEmail = (value: unknown): string => {
	const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
	assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254, 'Invalid email');
	return email;
};

const cleanPassword = (value: unknown): string => {
	assert(typeof value === 'string' && value.length >= 8 && value.length <= 200, 'Password must be at least 8 characters');
	return value;
};

const readCookie = (header: string | undefined, name: string): string | null => {
	const entry = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
	return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

const callbackUrl = (provider: string): string => `${config.serverUrl}/api/auth/${provider}/callback`;

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
	const email = cleanEmail(req.body?.email);
	const password = cleanPassword(req.body?.password);
	const username = cleanUsername(req.body?.username);
	try {
		const user = await createUser(email, await hashPassword(password), username);
		res.status(201).json({ token: signToken(user.id), user });
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new HttpError(409, 'An account already exists with this email');
		}
		throw error;
	}
});

authRouter.post('/login', async (req, res) => {
	const email = cleanEmail(req.body?.email);
	const password = typeof req.body?.password === 'string' ? req.body.password : '';
	const found = await findUserWithPassword(email);
	if (!found?.passwordHash || !(await verifyPassword(password, found.passwordHash))) {
		throw new HttpError(401, 'Invalid email or password');
	}
	const { passwordHash, ...user } = found;
	res.json({ token: signToken(user.id), user });
});

authRouter.get('/providers', (_req, res) => {
	res.json(enabledProviders());
});

authRouter.get('/:provider', (req, res) => {
	const provider = getProvider(req.params.provider);
	if (!provider) {
		throw new HttpError(404, 'Unknown login provider');
	}
	const state = randomToken();
	res.cookie(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
	const params = new URLSearchParams({
		client_id: provider.clientId,
		redirect_uri: callbackUrl(req.params.provider),
		response_type: 'code',
		scope: provider.scope,
		state,
	});
	res.redirect(`${provider.authorizeUrl}?${params}`);
});

authRouter.get('/:provider/callback', async (req, res) => {
	const provider = getProvider(req.params.provider);
	const expectedState = readCookie(req.headers.cookie, STATE_COOKIE);
	res.clearCookie(STATE_COOKIE);
	try {
		assert(provider, 'Unknown login provider');
		assert(typeof req.query.code === 'string', 'Missing code');
		assert(expectedState && req.query.state === expectedState, 'Invalid login state');
		const accessToken = await exchangeCode(provider, req.query.code, callbackUrl(req.params.provider));
		const user = await findOrCreateOAuthUser(req.params.provider, await provider.fetchProfile(accessToken));
		res.redirect(`${config.frontUrl}/auth/callback#token=${signToken(user.id)}`);
	} catch (error) {
		console.error(error);
		res.redirect(`${config.frontUrl}/auth/callback#error=${encodeURIComponent('Social login failed')}`);
	}
});
