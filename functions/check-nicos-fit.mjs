import { analyzeFitWithAI, FitAnalysisError } from "../src/server/fit-ai.mjs";
import {
  consumeRateLimit,
  jsonResponse,
  requestIdentifier,
} from "../src/server/http.mjs";
import { FitInputError, readFitInput } from "../src/server/fit-input.mjs";

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

export default function handler(request, context) {
  return handleFitAnalysis(request, context);
}
