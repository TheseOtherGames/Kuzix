import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_TITLE_LENGTH, uniqueTitle } from './title';

test('uniqueTitle numbers duplicates', () => {
	assert.equal(uniqueTitle('Quiz', []), 'Quiz');
	assert.equal(uniqueTitle('Quiz', ['Quiz']), 'Quiz (2)');
	assert.equal(uniqueTitle('Quiz', ['Quiz', 'Quiz (2)']), 'Quiz (3)');
	assert.equal(uniqueTitle('Quiz (2)', ['Quiz', 'Quiz (2)']), 'Quiz (3)');
	assert.equal(uniqueTitle('Quiz', ['Quiz', 'Quiz (3)']), 'Quiz (2)');
});

test('uniqueTitle keeps the max length', () => {
	const long = 'x'.repeat(MAX_TITLE_LENGTH);
	const result = uniqueTitle(long, [long]);
	assert.equal(result.length, MAX_TITLE_LENGTH);
	assert.ok(result.endsWith(' (2)'));
});
