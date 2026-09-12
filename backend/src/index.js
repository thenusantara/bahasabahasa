import { handleSignup } from "./routes/auth.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    if (
      url.pathname === "/auth/signup" &&
      request.method === "POST"
    ) {
      return handleSignup(request, env);
    }

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