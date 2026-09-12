import { json, error } from "../lib/response.js";
import { getAuthenticatedUser } from "../lib/session.js";
import { validateProfileInput } from "../lib/validation.js";

export async function handleGetProfile(
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

  const profile = await env.DB
    .prepare(
      `SELECT
        user_id,
        display_name,
        region_code,
        bio,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = ?
      LIMIT 1`
    )
    .bind(user.id)
    .first();

  if (!profile) {
    return json({
      profile: null
    });
  }

  return json({
    profile: {
      userId: profile.user_id,
      displayName: profile.display_name,
      regionCode: profile.region_code,
      bio: profile.bio,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  });
}

export async function handlePutProfile(
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
    validateProfileInput(input);

  if (!validation.ok) {
    return error(
      "validation_error",
      validation.message,
      400
    );
  }

  const {
    displayName,
    regionCode,
    bio
  } = validation.value;

  const now = new Date().toISOString();

  await env.DB
    .prepare(
      `INSERT INTO profiles (
        user_id,
        display_name,
        region_code,
        bio,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET
        display_name = excluded.display_name,
        region_code = excluded.region_code,
        bio = excluded.bio,
        updated_at = excluded.updated_at`
    )
    .bind(
      user.id,
      displayName,
      regionCode,
      bio,
      now,
      now
    )
    .run();

  const profile = await env.DB
    .prepare(
      `SELECT
        user_id,
        display_name,
        region_code,
        bio,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = ?
      LIMIT 1`
    )
    .bind(user.id)
    .first();

  return json({
    profile: {
      userId: profile.user_id,
      displayName: profile.display_name,
      regionCode: profile.region_code,
      bio: profile.bio,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  });
}