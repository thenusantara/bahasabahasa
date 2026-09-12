import { json, error } from "../lib/response.js";
import { getAuthenticatedUser } from "../lib/session.js";
import { createId } from "../lib/crypto.js";
import { validateUserLanguageInput } from "../lib/validation.js";

export async function handleGetLanguages(
  request,
  env
) {
  const result = await env.DB
    .prepare(
      `SELECT
        id,
        code,
        name,
        scope
      FROM languages
      WHERE status = 'active'
      ORDER BY name ASC`
    )
    .all();

  return json({
    languages: result.results.map(
      (language) => ({
        id: language.id,
        code: language.code,
        name: language.name,
        scope: language.scope
      })
    )
  });
}

export async function handleGetMyLanguages(
  request,
  env
) {
  const user = await getAuthenticatedUser(
    request,
    env
  );

  if (!user) {
    return error(
      "unauthorized",
      "Authentication is required.",
      401
    );
  }

  const result = await env.DB
    .prepare(
      `SELECT
        user_languages.id,
        languages.id AS language_id,
        languages.code,
        languages.name,
        languages.scope,
        user_languages.relationship,
        user_languages.region_note,
        user_languages.created_at
      FROM user_languages
      INNER JOIN languages
        ON languages.id = user_languages.language_id
      WHERE user_languages.user_id = ?
      ORDER BY
        languages.name ASC,
        user_languages.relationship ASC`
    )
    .bind(user.id)
    .all();

  return json({
    languages: result.results.map(
      (entry) => ({
        id: entry.id,
        language: {
          id: entry.language_id,
          code: entry.code,
          name: entry.name,
          scope: entry.scope
        },
        relationship: entry.relationship,
        regionNote: entry.region_note,
        createdAt: entry.created_at
      })
    )
  });
}

export async function handleAddMyLanguage(
  request,
  env
) {
  const user = await getAuthenticatedUser(
    request,
    env
  );

  if (!user) {
    return error(
      "unauthorized",
      "Authentication is required.",
      401
    );
  }

  let input;

  try {
    input = await request.json();
  } catch {
    return error(
      "invalid_json",
      "Request body must be valid JSON.",
      400
    );
  }

  const validation =
    validateUserLanguageInput(input);

  if (!validation.ok) {
    return error(
      "validation_error",
      validation.message,
      400
    );
  }

  const {
    languageId,
    relationship,
    regionNote
  } = validation.value;

  const language = await env.DB
    .prepare(
      `SELECT
        id,
        code,
        name,
        scope
      FROM languages
      WHERE id = ?
        AND status = 'active'
      LIMIT 1`
    )
    .bind(languageId)
    .first();

  if (!language) {
    return error(
      "language_not_found",
      "Language was not found.",
      404
    );
  }

  const existing = await env.DB
    .prepare(
      `SELECT id
      FROM user_languages
      WHERE user_id = ?
        AND language_id = ?
        AND relationship = ?
      LIMIT 1`
    )
    .bind(
      user.id,
      languageId,
      relationship
    )
    .first();

  if (existing) {
    return error(
      "relationship_exists",
      "This language relationship already exists.",
      409
    );
  }

  const id = createId("ulang");
  const now = new Date().toISOString();

  try {
    await env.DB
      .prepare(
        `INSERT INTO user_languages (
          id,
          user_id,
          language_id,
          relationship,
          region_note,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        user.id,
        languageId,
        relationship,
        regionNote,
        now
      )
      .run();
  } catch {
    return error(
      "relationship_creation_failed",
      "Unable to add language relationship.",
      500
    );
  }

  return json(
    {
      userLanguage: {
        id,
        language: {
          id: language.id,
          code: language.code,
          name: language.name,
          scope: language.scope
        },
        relationship,
        regionNote,
        createdAt: now
      }
    },
    201
  );
}

export async function handleDeleteMyLanguage(
  request,
  env,
  userLanguageId
) {
  const user = await getAuthenticatedUser(
    request,
    env
  );

  if (!user) {
    return error(
      "unauthorized",
      "Authentication is required.",
      401
    );
  }

  if (
    typeof userLanguageId !== "string" ||
    !userLanguageId.trim() ||
    userLanguageId.length > 100
  ) {
    return error(
      "invalid_relationship_id",
      "Language relationship identifier is invalid.",
      400
    );
  }

  const existing = await env.DB
    .prepare(
      `SELECT id
      FROM user_languages
      WHERE id = ?
        AND user_id = ?
      LIMIT 1`
    )
    .bind(
      userLanguageId,
      user.id
    )
    .first();

  if (!existing) {
    return error(
      "relationship_not_found",
      "Language relationship was not found.",
      404
    );
  }

  await env.DB
    .prepare(
      `DELETE FROM user_languages
      WHERE id = ?
        AND user_id = ?`
    )
    .bind(
      userLanguageId,
      user.id
    )
    .run();

  return json({
    success: true
  });
}