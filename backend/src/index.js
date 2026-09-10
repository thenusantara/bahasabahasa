export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({
        service: "bahasabahasa-api",
        status: "ok",
        environment: "development"
      });
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