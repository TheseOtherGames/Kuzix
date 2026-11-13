CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	email TEXT UNIQUE,
	password_hash TEXT,
	username TEXT NOT NULL,
	avatar TEXT NOT NULL DEFAULT '🦊',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription plan; its limits live in server/src/features/user/plans.ts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Application admin (access to /admin). Grant the first one by hand: UPDATE users SET is_admin = true WHERE email = '...';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Banned by an admin: every request and login is refused while set.
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

CREATE TABLE IF NOT EXISTS user_identities (
	provider TEXT NOT NULL,
	provider_user_id TEXT NOT NULL,
	user_id INTEGER NOT NULL REFERENCES users(id),
	PRIMARY KEY (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
	id SERIAL PRIMARY KEY,
	code CHAR(6) NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]{6}$'),
	owner_id INTEGER NOT NULL REFERENCES users(id),
	title TEXT NOT NULL,
	reveal_mode TEXT NOT NULL DEFAULT 'question' CHECK (reveal_mode IN ('question', 'end')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seconds of "get ready" countdown shown before each question (0 = none).
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS countdown INTEGER NOT NULL DEFAULT 3 CHECK (countdown BETWEEN 0 AND 10);

-- Soft delete: players' history still points at deleted quizzes.
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- A quiz only has a join code while it is open (see openRun / closeRun).
ALTER TABLE quizzes ALTER COLUMN code DROP NOT NULL;
UPDATE quizzes q SET code = NULL
WHERE code IS NOT NULL AND NOT EXISTS (SELECT 1 FROM runs r WHERE r.quiz_id = q.id AND r.ended_at IS NULL);

CREATE TABLE IF NOT EXISTS questions (
	id SERIAL PRIMARY KEY,
	quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
	position INTEGER NOT NULL,
	text TEXT NOT NULL,
	time_limit INTEGER NOT NULL CHECK (time_limit BETWEEN 5 AND 120),
	difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS answers (
	id SERIAL PRIMARY KEY,
	question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	text TEXT NOT NULL,
	is_correct BOOLEAN NOT NULL
);

-- A run is one opening of a quiz; the quiz is open while a run has no ended_at.
CREATE TABLE IF NOT EXISTS runs (
	id SERIAL PRIMARY KEY,
	quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
	started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	ended_at TIMESTAMPTZ
);

-- Owner cleared the stats: hidden from them, players keep the run in their history.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS runs_one_open_per_quiz ON runs (quiz_id) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS players (
	id SERIAL PRIMARY KEY,
	run_id INTEGER NOT NULL REFERENCES runs(id),
	user_id INTEGER REFERENCES users(id),
	token TEXT NOT NULL UNIQUE,
	nickname TEXT NOT NULL,
	avatar TEXT NOT NULL,
	score INTEGER NOT NULL DEFAULT 0,
	rank INTEGER,
	joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_user_id ON players (user_id);

CREATE TABLE IF NOT EXISTS player_answers (
	player_id INTEGER NOT NULL REFERENCES players(id),
	question_id INTEGER NOT NULL REFERENCES questions(id),
	answer_id INTEGER NOT NULL REFERENCES answers(id),
	time_ms INTEGER NOT NULL,
	points INTEGER NOT NULL,
	PRIMARY KEY (player_id, question_id)
);
