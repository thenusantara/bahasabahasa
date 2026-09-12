import {
  createId,
  createSessionToken,
  sha256
} from "./crypto.js";

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7;

export async function createSession(env, userId) {
  const sessionId = createId("ses");
  const token = createSessionToken();
  const tokenHash = await sha256(token);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() +
      SESSION_DURATION_SECONDS * 1000
  );

  await env.DB
    .prepare(
      `INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      sessionId,
      userId,
      tokenHash,
      expiresAt.toISOString(),
      now.toISOString()
    )
    .run();

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

export function getBearerToken(request) {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
    return null;
  }

  const match = authorization.match(
    /^Bearer\s+(.+)$/i
  );

  return match?.[1]?.trim() || null;
}

export async function getAuthenticatedUser(
  request,
  env
) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);
  const now = new Date().toISOString();

  return env.DB
    .prepare(
      `SELECT
        users.id,
        users.email,
        users.status,
        users.created_at
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
        AND users.status = 'active'
      LIMIT 1`
    )
    .bind(tokenHash, now)
    .first();
}

export async function deleteSession(
  request,
  env
) {
  const token = getBearerToken(request);

  if (!token) {
    return false;
  }

  const tokenHash = await sha256(token);

  const result = await env.DB
    .prepare(
      "DELETE FROM sessions WHERE token_hash = ?"
    )
    .bind(tokenHash)
    .run();

  return result.meta.changes > 0;
}