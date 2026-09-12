export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

export function error(code, message, status = 400) {
  return json(
    {
      error: {
        code,
        message
      }
    },
    status
  );
}