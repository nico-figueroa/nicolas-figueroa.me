// HTTP utility functions for handling JSON requests, rate limiting, and text sanitization

import { createHash } from "node:crypto";

const requestWindows = new Map();
const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 12;

// HTTP utility functions for handling JSON requests, rate limiting, and text sanitization
export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      ...extraHeaders,
    },
  });
}

// Read and parse the JSON body of a request, enforcing a maximum size limit
export async function readJsonBody(request, maximumBytes) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { error: "Content-Type must be application/json.", status: 415 };
  }

  const result = await readBodyBytes(request, maximumBytes);
  if (result.error) return result;

  let payload;
  try {
    payload = JSON.parse(result.bytes.toString("utf8"));
  } catch {
    return { error: "Request body must be valid JSON.", status: 400 };
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return { error: "Request body must be a JSON object.", status: 400 };
  }
  return { payload };
}

// Read the raw bytes of a request body, enforcing a maximum size limit
export async function readBodyBytes(request, maximumBytes) {
  if (!request.body) {
    return { error: "Request body is required.", status: 400 };
  }
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      return { error: "Request body is too large.", status: 413 };
    }
    chunks.push(value);
  }
  return { bytes: Buffer.concat(chunks) };
}

// Sanitize and truncate text input, removing control characters and enforcing a maximum length
export function sanitizeText(value, maximumLength) {
  if (typeof value !== "string") {
    return null;
  }
  const sanitized = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim();
  return sanitized && sanitized.length <= maximumLength ? sanitized : null;
}

// Consume a rate limit token for the given identifier, returning whether the request is allowed and the retry-after time
export function consumeRateLimit(identifier, now = Date.now()) {
  const key = createHash("sha256").update(String(identifier || "unknown")).digest("hex");
  if (requestWindows.size > 1_024) {
    for (const [storedKey, window] of requestWindows) {
      if (now - window.startedAt >= WINDOW_MS) requestWindows.delete(storedKey);
    }
  }
  if (requestWindows.size > 4_096) {
    requestWindows.delete(requestWindows.keys().next().value);
  }
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= REQUEST_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Generate a unique identifier for the request, typically based on the client's IP address
export function requestIdentifier(request, context) {
  return context?.ip || request.headers.get("x-nf-client-connection-ip") || "unknown";
}
