const API_BASE = "https://dev.bianettechltd.com";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const targetUrl = `${API_BASE}${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  return fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });
}
