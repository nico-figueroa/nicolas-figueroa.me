# Netlify Functions

The live endpoints are plain JavaScript Netlify Functions:

- `/.netlify/functions/ai-guide`
- `/.netlify/functions/check-nicos-fit`

Netlify does not currently support Python Functions. Per ADR-005, Python remains responsible for corpus construction, chunking, and embedding generation; the live request handlers use Netlify's supported Node.js runtime. OpenAI credentials are optional and are read only from server-side environment variables.

The rate limiter is process-local and best-effort because Netlify Functions scale across independent instances. It stores only a short-lived hash of the platform-provided client IP in memory, never logs it, and does not provide a globally coordinated quota.
