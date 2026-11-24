import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Request, Response } from 'express';
import { createLimiter, rateLimit } from './rateLimit';

test('rateLimit blocks an IP past the limit, not other IPs', () => {
	const limit = rateLimit(2, 60_000);
	const res = { setHeader: () => res } as unknown as Response;
	const call = (ip: string) => limit({ ip } as Request, res, () => {});
	call('a');
	call('a');
	assert.throws(() => call('a'), { status: 429 });
	call('b');
});

test('createLimiter waits only once a key used its hits', () => {
	const limiter = createLimiter(2, 60_000);
	limiter.hit('a');
	assert.equal(limiter.wait('a'), 0);
	limiter.hit('a');
	assert.ok(limiter.wait('a') > 0);
	assert.equal(limiter.wait('b'), 0);
});
