-- BahasaBahasa Backend
-- PHX-BB-BE-001
-- Migration 0001: Minimum Inhabited Platform
--
-- Core principle:
-- A human is not reduced to a single platform role.
-- Language relationships and participation interests
-- are modeled independently and can evolve over time.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id
    ON sessions(user_id);

CREATE INDEX idx_sessions_token_hash
    ON sessions(token_hash);

CREATE INDEX idx_sessions_expires_at
    ON sessions(expires_at);


CREATE TABLE profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    region_code TEXT,
    bio TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE languages (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'language'
        CHECK (scope IN ('language', 'variety')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL
);

CREATE INDEX idx_languages_name
    ON languages(name);


CREATE TABLE user_languages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    language_id TEXT NOT NULL,

    relationship TEXT NOT NULL
        CHECK (
            relationship IN (
                'speak',
                'learn',
                'teach',
                'research',
                'review'
            )
        ),

    region_note TEXT,
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (language_id)
        REFERENCES languages(id)
        ON DELETE RESTRICT,

    UNIQUE (
        user_id,
        language_id,
        relationship
    )
);

CREATE INDEX idx_user_languages_user_id
    ON user_languages(user_id);

CREATE INDEX idx_user_languages_language_id
    ON user_languages(language_id);


CREATE TABLE participation_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    interest TEXT NOT NULL
        CHECK (
            interest IN (
                'learn',
                'teach',
                'research',
                'contribute',
                'language_ai'
            )
        ),

    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE (
        user_id,
        interest
    )
);

CREATE INDEX idx_participation_interests_user_id
    ON participation_interests(user_id);