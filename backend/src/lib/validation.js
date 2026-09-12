const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

export function validateSignupInput(input) {
  const email = normalizeEmail(input?.email);
  const password =
    typeof input?.password === "string"
      ? input.password
      : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      field: "email",
      message: "Enter a valid email address."
    };
  }

  if (email.length > 254) {
    return {
      ok: false,
      field: "email",
      message: "Email address is too long."
    };
  }

  if (password.length < 12) {
    return {
      ok: false,
      field: "password",
      message: "Password must contain at least 12 characters."
    };
  }

  if (password.length > 128) {
    return {
      ok: false,
      field: "password",
      message: "Password must not exceed 128 characters."
    };
  }

  return {
    ok: true,
    value: {
      email,
      password
    }
  };
}

export function validateLoginInput(input) {
  const email = normalizeEmail(input?.email);
  const password =
    typeof input?.password === "string"
      ? input.password
      : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      message: "Enter a valid email address."
    };
  }

  if (!password) {
    return {
      ok: false,
      message: "Password is required."
    };
  }

  return {
    ok: true,
    value: {
      email,
      password
    }
  };
}