import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computePoints, computeRanks } from './scoring';

test('computePoints scales with difficulty and time', () => {
	assert.equal(computePoints(1, 0, 20), 200);
	assert.equal(computePoints(5, 0, 20), 1000);
	assert.equal(computePoints(5, 20000, 20), 500);
	assert.equal(computePoints(5, 10000, 20), 750);
	assert.equal(computePoints(3, 99999, 20), 300);
});

test('computeRanks shares ranks on ties', () => {
	assert.deepEqual(computeRanks([100, 300, 300, 0]), [3, 1, 1, 4]);
	assert.deepEqual(computeRanks([10, 20, 20, 30]), [4, 2, 2, 1]);
});
