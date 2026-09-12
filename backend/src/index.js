import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleMe
} from "./routes/auth.js";

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