import { json, error } from "../lib/response.js";
import {
  createId,
  hashPassword
} from "../lib/crypto.js";
import {
  validateSignupInput
} from "../lib/validation.js";

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