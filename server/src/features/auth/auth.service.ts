import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { config } from '../../core/config';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

export const hashPassword = async (password: string): Promise<string> => {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password, salt, 64);

	return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
	const [salt, hash] = stored.split(':');
	const candidate = await scryptAsync(password, Buffer.from(salt, 'hex'), 64);

	return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
};

export const signToken = (userId: number): string => {
	return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: '7d' });
};

export interface TokenClaims {
	userId: number;
	// Seconds since the epoch.
	issuedAt: number;
}

export const verifyToken = (token: string): TokenClaims | null => {
	try {
		const payload = jwt.verify(token, config.jwtSecret);
		if (typeof payload === 'object' && payload.sub && payload.iat) {
			return { userId: Number(payload.sub), issuedAt: payload.iat };
		}

		return null;
	} catch {
		return null;
	}
};

// Own key, so a confirmation link can never pass as a login token (and the other way round).
const emailKey = `${config.jwtSecret}:confirm-email`;

export const signEmailToken = (userId: number, email: string): string => {
	return jwt.sign({ sub: String(userId), email }, emailKey, { expiresIn: '24h' });
};

export const readEmailToken = (token: string): { userId: number; email: string } | null => {
	try {
		const payload = jwt.verify(token, emailKey);
		if (typeof payload === 'object' && payload.sub && typeof payload.email === 'string') {
			return { userId: Number(payload.sub), email: payload.email };
		}

		return null;
	} catch {
		return null;
	}
};

export const randomToken = (): string => randomBytes(24).toString('hex');
