import { NextResponse } from "next/server";

const proxiedRequestHeaders = ["authorization", "content-type", "cookie", "x-forwarded-for", "x-real-ip"];

export async function proxyToBackend(request: Request, path: string): Promise<NextResponse | null> {
  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) return null;

  const requestUrl = new URL(request.url);
  const backendUrl = new URL(path, baseUrl);
  backendUrl.search = requestUrl.search;

  const headers = new Headers();
  for (const name of proxiedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(backendUrl, init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
