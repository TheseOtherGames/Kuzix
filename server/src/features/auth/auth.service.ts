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

export const verifyToken = (token: string): number | null => {
	try {
		const payload = jwt.verify(token, config.jwtSecret);
		if (typeof payload === 'object' && payload.sub) {
			return Number(payload.sub);
		}

		return null;
	} catch {
		return null;
	}
};

export const randomToken = (): string => randomBytes(24).toString('hex');
