import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const migrate = async (): Promise<void> => {
	const sql = await readFile(path.join(import.meta.dirname, 'schema.sql'), 'utf8');
	await pool.query(sql);
};

export const withTransaction = async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await fn(client);
		await client.query('COMMIT');

		return result;
	} catch (error) {
		await client.query('ROLLBACK');

		throw error;
	} finally {
		client.release();
	}
};
