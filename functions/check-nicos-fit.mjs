import { analyzeFit } from "../src/server/fit.mjs";
import {
  consumeRateLimit,
  jsonResponse,
  requestIdentifier,
} from "../src/server/http.mjs";
import { FitInputError, readFitInput } from "../src/server/fit-input.mjs";

export function handleFitAnalysis(request, context = {}) {
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
    .then((jobDescription) => jsonResponse(analyzeFit(jobDescription)))
    .catch((error) => {
      if (!(error instanceof FitInputError)) throw error;
      return jsonResponse({ error: error.message }, error.status);
    });
}

export default function handler(request, context) {
  return handleFitAnalysis(request, context);
}
