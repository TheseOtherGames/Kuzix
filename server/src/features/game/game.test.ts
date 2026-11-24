import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { pool } from '../../core/db/pool';
import { Game } from './game';
import type { Quiz } from '../quiz/quiz.types';

test('addPlayer stops at maxPlayers, even with parallel joins', async () => {
	let id = 0;
	mock.method(pool, 'query', async () => ({ rows: [{ id: ++id }] }));
	const game = new Game({ revealMode: 'live', countdown: 0, questions: [] } as unknown as Quiz, 1);
	const joins = Array.from({ length: 5 }, () => game.addPlayer(null as never, 'Bob', 'a', null, 3));
	const results = await Promise.allSettled(joins);
	assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
	await assert.rejects(game.addPlayer(null as never, 'Bob', 'a', null, 3), /This game is full/);
	mock.restoreAll();
	await pool.end();
});
