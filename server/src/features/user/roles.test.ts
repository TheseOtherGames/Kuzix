import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminAreasOf, cleanRoleInput, mergeLimits } from './roles';
import { PLANS } from './plans';
import type { UserRole } from './user.types';

const PARTNER: UserRole = {
	name: 'Partner', icon: 'star', color: '#ffaa00', limits: { maxQuizzes: 50 }, admin: [],
};

test('cleanRoleInput keeps only known, valid limits and admin sections', () => {
	const role = cleanRoleInput({
		name: ' Pro ',
		icon: 'star',
		color: '#FFAA00',
		limits: { maxQuizzes: 50, maxPlayers: null, unknown: 3 },
		admin: [
			'reports',
			'roles',
			'users',
			'reports',
		],
	});
	assert.deepEqual(role, {
		name: 'Pro', icon: 'star', color: '#ffaa00', limits: { maxQuizzes: 50 }, admin: ['users', 'reports'],
	});
	assert.deepEqual(cleanRoleInput({ name: 'Pro', icon: 'star', color: '#ffaa00' }).admin, []);
	assert.throws(() => cleanRoleInput({
		name: 'Pro', icon: 'star', color: '#ffaa00', limits: { maxQuizzes: 0 },
	}));
	assert.throws(() => cleanRoleInput({
		name: 'Pro', icon: 'star', color: '#ffaa00', admin: 'users',
	}));
	assert.throws(() => cleanRoleInput({ name: 'Pro', icon: '<svg>', color: '#ffaa00' }));
	assert.throws(() => cleanRoleInput({ name: '', icon: 'star', color: '#ffaa00' }));
});

test('mergeLimits lets the role override the plan', () => {
	assert.deepEqual(mergeLimits(PLANS.free, null), PLANS.free);
	assert.equal(mergeLimits(PLANS.free, PARTNER).maxQuizzes, 50);
	assert.equal(mergeLimits(PLANS.free, PARTNER).maxPlayers, PLANS.free.maxPlayers);
});

test('adminAreasOf: roles never grant role management', () => {
	assert.deepEqual(adminAreasOf(false, null), []);
	assert.deepEqual(adminAreasOf(false, { ...PARTNER, admin: ['reports'] }), ['reports']);
	assert.ok(adminAreasOf(true, null).includes('roles'));
});
