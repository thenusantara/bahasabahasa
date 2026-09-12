import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleMe
} from "./routes/auth.js";

import {
  handleGetProfile,
  handlePutProfile
} from "./routes/profile.js";

import {
  handleGetLanguages,
  handleGetMyLanguages,
  handleAddMyLanguage,
  handleDeleteMyLanguage
} from "./routes/languages.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (
      url.pathname === "/health" &&
      request.method === "GET"
    ) {
      return Response.json({
        service: "bahasabahasa-api",
        status: "ok",
        environment: "development"
      });
    }

    // Create account
    if (
      url.pathname === "/auth/signup" &&
      request.method === "POST"
    ) {
      return handleSignup(request, env);
    }

    // Login
    if (
      url.pathname === "/auth/login" &&
      request.method === "POST"
    ) {
      return handleLogin(request, env);
    }

    // Logout
    if (
      url.pathname === "/auth/logout" &&
      request.method === "POST"
    ) {
      return handleLogout(request, env);
    }

    // Current authenticated user
    if (
      url.pathname === "/auth/me" &&
      request.method === "GET"
    ) {
      return handleMe(request, env);
    }

    if (
    url.pathname === "/me/profile" &&
    request.method === "GET"
  ) {
  return handleGetProfile(
    request,
    env
  );
  }

  if (
  url.pathname === "/me/profile" &&
  request.method === "PUT"
  ) {
  return handlePutProfile(
    request,
    env
  );
  }

  if (
  url.pathname === "/languages" &&
  request.method === "GET"
  ) {
  return handleGetLanguages(
    request,
    env
  );
  }

  if (
  url.pathname === "/me/languages" &&
  request.method === "GET"
  ) {
  return handleGetMyLanguages(
    request,
    env
  );
  }

  if (
  url.pathname === "/me/languages" &&
  request.method === "POST"
  ) {
  return handleAddMyLanguage(
    request,
    env
  );
  }

  const userLanguageMatch =
  url.pathname.match(
    /^\/me\/languages\/([^/]+)$/
  );

  if (
  userLanguageMatch &&
  request.method === "DELETE"
  ) {
  return handleDeleteMyLanguage(
    request,
    env,
    userLanguageMatch[1]
  );
  }

    // Fallback
    return Response.json(
      {
        error: "Not Found"
      },
      {
        status: 404
      }
    );
  }
};