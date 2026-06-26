const API_BASE = "https://dev.bianettechltd.com";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const url = new URL(req.url);
  const targetUrl = API_BASE + url.pathname + (url.search || "");

  const headers = new Headers(req.headers);
  headers.delete("host");

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
