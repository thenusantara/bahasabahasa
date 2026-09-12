import { json, error } from "../lib/response.js";

import {
  createId,
  hashPassword,
  verifyPassword
} from "../lib/crypto.js";

import {
  validateSignupInput,
  validateLoginInput
} from "../lib/validation.js";

import {
  createSession,
  deleteSession,
  getAuthenticatedUser
} from "../lib/session.js";

export async function handleSignup(request, env) {
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

  const validation = validateSignupInput(input);

  if (!validation.ok) {
    return error(
      "validation_error",
      validation.message,
      400
    );
  }

  const { email, password } = validation.value;

  const existingUser = await env.DB
    .prepare(
      "SELECT id FROM users WHERE email = ? LIMIT 1"
    )
    .bind(email)
    .first();

  if (existingUser) {
    return error(
      "email_in_use",
      "An account with this email already exists.",
      409
    );
  }

  const userId = createId("usr");
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  try {
    await env.DB
      .prepare(
        `INSERT INTO users (
          id,
          email,
          password_hash,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 'active', ?, ?)`
      )
      .bind(
        userId,
        email,
        passwordHash,
        now,
        now
      )
      .run();
  } catch {
    return error(
      "account_creation_failed",
      "Unable to create account.",
      500
    );
  }

  return json(
    {
      user: {
        id: userId,
        email,
        status: "active",
        createdAt: now
      }
    },
    201
  );
}

export async function handleLogin(request, env) {
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

  const validation = validateLoginInput(input);

  if (!validation.ok) {
    return error(
      "validation_error",
      validation.message,
      400
    );
  }

  const { email, password } = validation.value;

  const user = await env.DB
    .prepare(
      `SELECT
        id,
        email,
        password_hash,
        status
      FROM users
      WHERE email = ?
      LIMIT 1`
    )
    .bind(email)
    .first();

  if (
    !user ||
    user.status !== "active" ||
    !(await verifyPassword(
      password,
      user.password_hash
    ))
  ) {
    return error(
      "invalid_credentials",
      "Email or password is incorrect.",
      401
    );
  }

  const session = await createSession(
    env,
    user.id
  );

  return json({
    user: {
      id: user.id,
      email: user.email,
      status: user.status
    },
    session: {
      token: session.token,
      expiresAt: session.expiresAt
    }
  });
}

export async function handleMe(request, env) {
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

  return json({
    user: {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.created_at
    }
  });
}

export async function handleLogout(
  request,
  env
) {
  const deleted = await deleteSession(
    request,
    env
  );

  if (!deleted) {
    return error(
      "unauthorized",
      "Authentication is required.",
      401
    );
  }

  return json({
    success: true
  });
}