-- BahasaBahasa Backend
-- PHX-BB-BE-001
-- Migration 0002: Minimum Language Seed
--
-- This is an operational seed for the first inhabited platform.
-- It is not intended to represent the complete BahasaBahasa
-- linguistic research catalogue.

INSERT INTO languages (
    id,
    code,
    name,
    scope,
    status,
    created_at
)
VALUES
    (
        'lang-ind',
        'ind',
        'Bahasa Indonesia',
        'language',
        'active',
        CURRENT_TIMESTAMP
    ),
    (
        'lang-jav',
        'jav',
        'Bahasa Jawa',
        'language',
        'active',
        CURRENT_TIMESTAMP
    ),
    (
        'lang-mad',
        'mad',
        'Bahasa Madura',
        'language',
        'active',
        CURRENT_TIMESTAMP
    );