import path from 'node:path';

try {
	process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch {
	// No .env file: rely on the process environment.
}

const required = (name: string): string => {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing environment variable ${name}`);
	}

	return value;
};

export const config = {
	port: Number(process.env.PORT ?? 3000),
	// DATABASE_URL overrides; otherwise built from the same POSTGRES_* vars docker-compose.yml uses.
	databaseUrl:
		process.env.DATABASE_URL ||
		`postgres://${encodeURIComponent(required('POSTGRES_USER'))}:${encodeURIComponent(required('POSTGRES_PASSWORD'))}` +
			`@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? 5432}/${encodeURIComponent(required('POSTGRES_DB'))}`,
	jwtSecret: required('JWT_SECRET'),
	frontUrl: process.env.FRONT_URL ?? 'http://localhost:5173',
	serverUrl: process.env.SERVER_URL ?? 'http://localhost:5173',
	// Email confirmation for password accounts; off (sign-up logs in at once) when SMTP_HOST is empty.
	smtp: {
		host: process.env.SMTP_HOST ?? '',
		port: Number(process.env.SMTP_PORT || 587),
		user: process.env.SMTP_USER ?? '',
		password: process.env.SMTP_PASSWORD ?? '',
		from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
	},
	oauth: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID ?? '',
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
		},
	},
};
