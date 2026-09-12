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

export function validateProfileInput(input) {
  const displayName =
    typeof input?.displayName === "string"
      ? input.displayName.trim()
      : "";

  const regionCode =
    typeof input?.regionCode === "string"
      ? input.regionCode.trim()
      : "";

  const bio =
    typeof input?.bio === "string"
      ? input.bio.trim()
      : "";

  if (displayName.length < 2) {
    return {
      ok: false,
      message: "Display name must contain at least 2 characters."
    };
  }

  if (displayName.length > 80) {
    return {
      ok: false,
      message: "Display name must not exceed 80 characters."
    };
  }

  if (regionCode.length > 64) {
    return {
      ok: false,
      message: "Region code must not exceed 64 characters."
    };
  }

  if (bio.length > 500) {
    return {
      ok: false,
      message: "Bio must not exceed 500 characters."
    };
  }

  return {
    ok: true,
    value: {
      displayName,
      regionCode: regionCode || null,
      bio: bio || null
    }
  };
}

const LANGUAGE_RELATIONSHIPS = new Set([
  "speak",
  "learn",
  "teach",
  "research",
  "review"
]);

export function validateUserLanguageInput(input) {
  const languageId =
    typeof input?.languageId === "string"
      ? input.languageId.trim()
      : "";

  const relationship =
    typeof input?.relationship === "string"
      ? input.relationship.trim().toLowerCase()
      : "";

  const regionNote =
    typeof input?.regionNote === "string"
      ? input.regionNote.trim()
      : "";

  if (!languageId) {
    return {
      ok: false,
      message: "Language is required."
    };
  }

  if (languageId.length > 100) {
    return {
      ok: false,
      message: "Language identifier is too long."
    };
  }

  if (
    !LANGUAGE_RELATIONSHIPS.has(
      relationship
    )
  ) {
    return {
      ok: false,
      message:
        "Relationship must be speak, learn, teach, research, or review."
    };
  }

  if (regionNote.length > 120) {
    return {
      ok: false,
      message:
        "Region note must not exceed 120 characters."
    };
  }

  return {
    ok: true,
    value: {
      languageId,
      relationship,
      regionNote: regionNote || null
    }
  };
}