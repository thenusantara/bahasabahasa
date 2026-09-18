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

import {
  handleGetMyInterests,
  handlePutMyInterests
} from "./routes/interests.js";


// ============================================================
// CORS
// ============================================================

const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:5500",
  "https://bahasabahasa.com"
]);


function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Vary": "Origin"
  };
}


function applyCors(response, request) {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);

  Object.entries(corsHeaders).forEach(
    ([name, value]) => {
      headers.set(name, value);
    }
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}


function handleOptions(request) {
  const origin = request.headers.get("Origin");

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, {
      status: 403
    });
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
}


// ============================================================
// Request Router
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    let response;


    // ========================================================
    // Health
    // ========================================================

    if (
      url.pathname === "/health" &&
      request.method === "GET"
    ) {
      response = Response.json({
        service: "bahasabahasa-api",
        status: "ok"
      });

      return applyCors(response, request);
    }


    // ========================================================
    // Authentication
    // ========================================================

    if (
      url.pathname === "/auth/signup" &&
      request.method === "POST"
    ) {
      response = await handleSignup(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/auth/login" &&
      request.method === "POST"
    ) {
      response = await handleLogin(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/auth/logout" &&
      request.method === "POST"
    ) {
      response = await handleLogout(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/auth/me" &&
      request.method === "GET"
    ) {
      response = await handleMe(
        request,
        env
      );

      return applyCors(response, request);
    }


    // ========================================================
    // Profile
    // ========================================================

    if (
      url.pathname === "/me/profile" &&
      request.method === "GET"
    ) {
      response = await handleGetProfile(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/me/profile" &&
      request.method === "PUT"
    ) {
      response = await handlePutProfile(
        request,
        env
      );

      return applyCors(response, request);
    }


    // ========================================================
    // Languages
    // ========================================================

    if (
      url.pathname === "/languages" &&
      request.method === "GET"
    ) {
      response = await handleGetLanguages(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/me/languages" &&
      request.method === "GET"
    ) {
      response = await handleGetMyLanguages(
        request,
        env
      );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/me/languages" &&
      request.method === "POST"
    ) {
      response = await handleAddMyLanguage(
        request,
        env
      );

      return applyCors(response, request);
    }

    const userLanguageMatch =
      url.pathname.match(
        /^\/me\/languages\/([^/]+)$/
      );

    if (
      userLanguageMatch &&
      request.method === "DELETE"
    ) {
      response =
        await handleDeleteMyLanguage(
          request,
          env,
          userLanguageMatch[1]
        );

      return applyCors(response, request);
    }


    // ========================================================
    // Participation Interests
    // ========================================================

    if (
      url.pathname === "/me/interests" &&
      request.method === "GET"
    ) {
      response =
        await handleGetMyInterests(
          request,
          env
        );

      return applyCors(response, request);
    }

    if (
      url.pathname === "/me/interests" &&
      request.method === "PUT"
    ) {
      response =
        await handlePutMyInterests(
          request,
          env
        );

      return applyCors(response, request);
    }


    // ========================================================
    // Fallback
    // ========================================================

    response = Response.json(
      {
        error: "Not Found"
      },
      {
        status: 404
      }
    );

    return applyCors(response, request);
  }
};