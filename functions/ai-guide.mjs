import {
  evidenceOnlyResponse,
  generateGroundedAnswer,
  retrieveEvidence,
} from "../src/server/knowledge.mjs";
import {
  consumeRateLimit,
  jsonResponse,
  readJsonBody,
  requestIdentifier,
  sanitizeText,
} from "../src/server/http.mjs";

const MAX_BODY_BYTES = 8_000;
const MAX_QUESTION_LENGTH = 1_200;

export async function handleGuide(request, context = {}, apiKeyValue = process.env.OPENAI_API_KEY || "") {
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

  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if (parsed.error) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }
  const question = sanitizeText(parsed.payload.question, MAX_QUESTION_LENGTH);
  if (!question) {
    return jsonResponse(
      { error: `Question must be plain text between 1 and ${MAX_QUESTION_LENGTH} characters.` },
      400,
    );
  }

  const apiKey = apiKeyValue.trim();
  const modelPattern = /^[a-z0-9._-]{1,80}$/i;
  const invalidApiKey = apiKeyValue !== apiKey
    || apiKey.length > 512
    || /[\u0000-\u001F\u007F]/.test(apiKey);
  const invalidModel = Boolean(apiKey) && (
    (process.env.OPENAI_MODEL && !modelPattern.test(process.env.OPENAI_MODEL))
    || (process.env.OPENAI_EMBEDDING_MODEL
      && !modelPattern.test(process.env.OPENAI_EMBEDDING_MODEL))
  );
  const invalidConfiguration = invalidApiKey || invalidModel;
  const configurationNotice = invalidApiKey
    ? "OPENAI_API_KEY is invalid. Only local source excerpts are shown."
    : "An OpenAI model environment variable is invalid. Only local source excerpts are shown.";
  const activeApiKey = invalidConfiguration ? "" : apiKey;
  const retrieval = await retrieveEvidence(question, activeApiKey);
  if (retrieval.evidence.length === 0) {
    return jsonResponse(evidenceOnlyResponse(
      [],
      retrieval.searchMode,
      invalidConfiguration ? "unavailable" : activeApiKey ? "no-evidence" : "disabled",
      invalidConfiguration
        ? configurationNotice
        : "No matching evidence was found; no answer was generated.",
    ));
  }
  if (invalidConfiguration) {
    return jsonResponse(evidenceOnlyResponse(
      retrieval.evidence,
      retrieval.searchMode,
      "unavailable",
      configurationNotice,
    ));
  }
  if (!activeApiKey) {
    return jsonResponse(evidenceOnlyResponse(
      retrieval.evidence,
      retrieval.searchMode,
      "disabled",
      "OpenAI is not configured. Only local source excerpts are shown.",
    ));
  }

  try {
    return jsonResponse(await generateGroundedAnswer(
      question,
      retrieval.evidence,
      activeApiKey,
      retrieval.searchMode,
    ));
  } catch {
    return jsonResponse(evidenceOnlyResponse(
      retrieval.evidence,
      retrieval.searchMode,
      "unavailable",
      "OpenAI could not produce a validated cited answer. Only local source excerpts are shown.",
    ));
  }
}

export default function handler(request, context) {
  return handleGuide(request, context);
}
