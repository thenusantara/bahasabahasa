import {
  json,
  error
} from "../lib/response.js";

import {
  getAuthenticatedUser
} from "../lib/session.js";

import {
  createId
} from "../lib/crypto.js";

import {
  validateParticipationInterestsInput
} from "../lib/validation.js";

export async function handleGetMyInterests(
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
        id,
        interest,
        created_at
      FROM participation_interests
      WHERE user_id = ?
      ORDER BY interest ASC`
    )
    .bind(user.id)
    .all();

  const interests = (
    result.results || []
  ).map((row) => ({
    id: row.id,
    interest: row.interest,
    createdAt: row.created_at
  }));

  return json({
    interests
  });
}

export async function handlePutMyInterests(
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
    validateParticipationInterestsInput(
      input
    );

  if (!validation.ok) {
    return error(
      "invalid_interests",
      validation.message,
      400
    );
  }

  const { interests } =
    validation.value;

  const now = new Date().toISOString();

  const statements = [
    env.DB
      .prepare(
        `DELETE FROM participation_interests
        WHERE user_id = ?`
      )
      .bind(user.id)
  ];

  for (const interest of interests) {
    statements.push(
      env.DB
        .prepare(
          `INSERT INTO participation_interests (
            id,
            user_id,
            interest,
            created_at
          )
          VALUES (?, ?, ?, ?)`
        )
        .bind(
          createId("interest"),
          user.id,
          interest,
          now
        )
    );
  }

  try {
    await env.DB.batch(statements);
  } catch {
    return error(
      "interests_update_failed",
      "Participation interests could not be updated.",
      500
    );
  }

  const result = await env.DB
    .prepare(
      `SELECT
        id,
        interest,
        created_at
      FROM participation_interests
      WHERE user_id = ?
      ORDER BY interest ASC`
    )
    .bind(user.id)
    .all();

  const currentInterests = (
    result.results || []
  ).map((row) => ({
    id: row.id,
    interest: row.interest,
    createdAt: row.created_at
  }));

  return json({
    interests: currentInterests
  });
}