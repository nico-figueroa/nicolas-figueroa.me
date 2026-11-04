// check-nicos-fit.mjs - Handles AI-guided fit analysis for job descriptions, including rate limiting and error handling.
// Exposes a handler function for processing POST requests with job descriptions and returning fit analysis results.

import { analyzeFitWithAI, FitAnalysisError } from "../src/server/fit-ai.mjs";
import {
  consumeRateLimit,
  jsonResponse,
  requestIdentifier,
} from "../src/server/http.mjs";
import { FitInputError, readFitInput } from "../src/server/fit-input.mjs";

// Handles the incoming request, validates it, enforces rate limits, reads the job description input, and performs fit analysis.
export function handleFitAnalysis(request, context = {}, options = {}) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, { allow: "POST" });
  }

  const limit = consumeRateLimit(requestIdentifier(request, context));
  if (!limit.allowed) {
    return jsonResponse(
      { error: "Too many requests. Please try again shortly." },
      429,
      { "retry-after": String(limit.retryAfter) },
    );
  }

  return readFitInput(request)
    .then(async (jobDescription) => jsonResponse(await analyzeFitWithAI(jobDescription, options)))
    .catch((error) => {
      if (error instanceof FitInputError) return jsonResponse({ error: error.message }, error.status);
      if (error instanceof FitAnalysisError) {
        console.error("Fit assessment failed", { code: error.code });
        return jsonResponse({ error: error.message }, error.status);
      }
      console.error("Fit assessment failed", { code: "unexpected_error" });
      return jsonResponse({ error: "Fit analysis failed unexpectedly. Please try again later." }, 500);
    });
}

// Export the default handler function for the Netlify function endpoint.
export default function handler(request, context) {
  return handleFitAnalysis(request, context);
}
