import { lookup } from "node:dns/promises";
import https from "node:https";
import { DOMMatrix } from "@napi-rs/canvas";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
import WordExtractor from "word-extractor";
import { readBodyBytes, readJsonBody, sanitizeText } from "./http.mjs";

globalThis.DOMMatrix ??= DOMMatrix;
const { PDFParse } = await import("pdf-parse");

export const MAX_JOB_DESCRIPTION_LENGTH = 12_000;
export const MAX_FILE_BYTES = 2_000_000;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 128_000;
const MAX_URL_RESPONSE_BYTES = 1_000_000;
const MAX_PDF_PAGES = 100;
const PDF_PARSE_TIMEOUT_MS = 12_000;
const ALLOWED_FILE_TYPES = new Set([
  "csv", "doc", "docx", "htm", "html", "json", "md", "pdf", "rtf", "tsv", "txt",
]);

export class FitInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "FitInputError";
    this.status = status;
  }
}

function flattenJson(value, output = [], depth = 0, state = { length: 0 }) {
  if (state.length >= MAX_JOB_DESCRIPTION_LENGTH || depth > 10) return output;
  const append = (item) => {
    const text = String(item).slice(0, MAX_JOB_DESCRIPTION_LENGTH - state.length);
    output.push(text);
    state.length += text.length;
  };
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    append(value);
  } else if (Array.isArray(value)) {
    for (const item of value) flattenJson(item, output, depth + 1, state);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      append(key);
      flattenJson(item, output, depth + 1, state);
    }
  }
  return output;
}

function normalizeText(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return flattenJson(JSON.parse(trimmed)).join(" ");
    } catch {
      throw new FitInputError("Pasted JSON is invalid. Correct it or provide the description as plain text.");
    }
  }
  return trimmed;
}

function csvToText(input, delimiter = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted && character === '"' && input[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim());
      rows.push(row.filter(Boolean).join(" | "));
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  rows.push(row.filter(Boolean).join(" | "));
  return rows.filter(Boolean).join("\n");
}

function rtfToText(input) {
  return input
    .replace(/\\'[0-9a-f]{2}/gi, (match) =>
      String.fromCharCode(Number.parseInt(match.slice(2), 16)))
    .replace(/\\u(-?\d+)\??/g, (_, value) => String.fromCharCode(Number(value) & 0xffff))
    .replace(/\\(?:par|line)\b ?/gi, "\n")
    .replace(/\\tab\b ?/gi, "\t")
    .replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/\\[{}\\]/g, "")
    .replace(/[{}]/g, "")
    .trim();
}

function validateDocxArchive(buffer) {
  const searchStart = Math.max(0, buffer.length - 65_557);
  let endOffset = -1;
  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new FitInputError("The selected DOCX file is not a valid Word archive.");

  const diskNumber = buffer.readUInt16LE(endOffset + 4);
  const directoryDisk = buffer.readUInt16LE(endOffset + 6);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (
    diskNumber !== 0
    || directoryDisk !== 0
    || entryCount > 2_000
    || directoryOffset + directorySize > endOffset
  ) {
    throw new FitInputError("The selected DOCX file has an unsupported archive structure.");
  }

  let position = directoryOffset;
  let expandedSize = 0;
  const entries = new Set();
  for (let index = 0; index < entryCount; index += 1) {
    if (position + 46 > directoryOffset + directorySize) {
      throw new FitInputError("The selected DOCX file has an invalid archive directory.");
    }
    if (buffer.readUInt32LE(position) !== 0x02014b50) {
      throw new FitInputError("The selected DOCX file has an invalid archive directory.");
    }
    const flags = buffer.readUInt16LE(position + 8);
    const compression = buffer.readUInt16LE(position + 10);
    const compressedSize = buffer.readUInt32LE(position + 20);
    const uncompressedSize = buffer.readUInt32LE(position + 24);
    const nameLength = buffer.readUInt16LE(position + 28);
    const extraLength = buffer.readUInt16LE(position + 30);
    const commentLength = buffer.readUInt16LE(position + 32);
    const entryLength = 46 + nameLength + extraLength + commentLength;
    if (
      position + entryLength > directoryOffset + directorySize
      || flags & 1
      || ![0, 8].includes(compression)
      || uncompressedSize === 0xffffffff
      || compressedSize === 0xffffffff
      || uncompressedSize > 10_000_000
      || uncompressedSize > Math.max(compressedSize, 1) * 100
    ) {
      throw new FitInputError("The selected DOCX file uses unsupported or oversized archive data.");
    }
    expandedSize += uncompressedSize;
    if (expandedSize > 20_000_000) {
      throw new FitInputError("The selected DOCX file expands beyond the processing limit.", 413);
    }
    entries.add(buffer.toString("utf8", position + 46, position + 46 + nameLength));
    position += entryLength;
  }
  if (!entries.has("[Content_Types].xml") || !entries.has("word/document.xml")) {
    throw new FitInputError("The selected file is not a readable DOCX document.");
  }
}

export function extractHtmlText(html) {
  const document = load(html);
  document("script, style, noscript, svg, iframe, nav, footer").remove();
  const title = document("title").first().text().trim();
  const body = document("main").text().trim()
    || document("article").text().trim()
    || document("body").text().trim();
  return [title, body].filter(Boolean).join("\n\n").replace(/\s+/g, " ").trim();
}

export function validateJobDescriptionUrl(value) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw new FitInputError("Enter a valid HTTPS job-description URL.");
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new FitInputError("Enter a valid HTTPS job-description URL.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (
    url.protocol !== "https:"
    || url.username
    || url.password
    || url.port && url.port !== "443"
    || !hostname
    || ipaddr.isValid(hostname)
  ) {
    throw new FitInputError("Only public HTTPS URLs on the standard port are supported.");
  }
  url.hash = "";
  return url;
}

function isPublicAddress(address) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}

async function fetchPublicJobPage(url) {
  let addresses;
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new FitInputError("This URL's host could not be resolved to a public address.", 422);
  }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new FitInputError("This URL does not resolve exclusively to public network addresses.");
  }
  const pinnedAddress = addresses[0];
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      headers: {
        accept: "text/html, application/xhtml+xml, text/plain;q=0.9",
        "accept-encoding": "identity",
        "user-agent": "NicolasFigueroaPortfolioFitAnalyzer/1.0",
      },
      lookup: (_hostname, options, callback) => {
        const address = {
          address: pinnedAddress.address,
          family: pinnedAddress.family,
        };
        if (options?.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
      signal: AbortSignal.timeout(8_000),
    }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new FitInputError(
          response.statusCode >= 300 && response.statusCode < 400
            ? "URL redirects are not supported. Paste the job description or use its final HTTPS URL."
            : `The job-description page returned HTTP ${response.statusCode}.`,
          422,
        ));
        return;
      }
      const contentType = response.headers["content-type"]?.split(";")[0].trim().toLowerCase();
      if (!["text/html", "application/xhtml+xml", "text/plain"].includes(contentType)) {
        response.resume();
        reject(new FitInputError("The URL must point to a readable HTML or plain-text page.", 415));
        return;
      }
      const contentLength = Number(response.headers["content-length"] || 0);
      if (contentLength > MAX_URL_RESPONSE_BYTES) {
        response.destroy();
        reject(new FitInputError("The job-description page is too large to process.", 413));
        return;
      }
      const chunks = [];
      let totalBytes = 0;
      response.on("data", (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_URL_RESPONSE_BYTES) {
          response.destroy(new FitInputError("The job-description page is too large to process.", 413));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const page = Buffer.concat(chunks).toString("utf8");
        resolve(contentType === "text/plain" ? page : extractHtmlText(page));
      });
      response.on("error", reject);
    });
    request.on("error", (error) => {
      if (error instanceof FitInputError) reject(error);
      else reject(new FitInputError("Could not retrieve that job-description URL. Paste its text or upload a file.", 422));
    });
    request.end();
  });
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const { total = 0 } = await parser.getInfo();
        if (!total) return "";
        const pages = Array.from({ length: Math.min(total, MAX_PDF_PAGES) }, (_, index) => index + 1);
        const result = await parser.getText({ partial: pages });
        return total > MAX_PDF_PAGES
          ? `${result.text}\n\n(Only the first ${MAX_PDF_PAGES} pages were processed.)`
          : result.text;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new FitInputError("PDF processing took too long. Try a smaller or text-based PDF.", 422)),
          PDF_PARSE_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    if (error instanceof FitInputError) throw error;
    throw new FitInputError("Could not read this PDF. Try a text-based PDF or paste the description.", 422);
  } finally {
    clearTimeout(timer);
    await parser.destroy();
  }
}

export async function extractJobDescriptionFile(fileName, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new FitInputError("Choose a non-empty job-description file.");
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw new FitInputError("Files must be 2 MB or smaller.", 413);
  }
  const extension = fileName.toLowerCase().split(".").at(-1);
  if (!ALLOWED_FILE_TYPES.has(extension)) {
    throw new FitInputError("Supported files: PDF, DOC/DOCX, TXT, Markdown, CSV/TSV, JSON, HTML, and RTF.", 415);
  }

  let text;
  if (extension === "pdf") {
    if (!buffer.subarray(0, 1_024).toString("latin1").includes("%PDF-")) {
      throw new FitInputError("The selected file is not a valid PDF.");
    }
    text = await extractPdfText(buffer);
  } else if (extension === "doc" || extension === "docx") {
    const isLegacyWord = buffer.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex"));
    const isOpenXmlWord = buffer.subarray(0, 2).toString() === "PK";
    if (extension === "doc" ? !isLegacyWord : !isOpenXmlWord) {
      throw new FitInputError("The selected Word file does not match its file extension.");
    }
    if (extension === "docx") validateDocxArchive(buffer);
    try {
      const document = await new WordExtractor().extract(buffer);
      text = document.getBody();
    } catch {
      throw new FitInputError("Could not read this Word document. Try saving it as DOCX or paste the description.", 422);
    }
  } else {
    const contents = buffer.toString("utf8");
    if (extension === "json") {
      try {
        text = flattenJson(JSON.parse(contents)).join(" ");
      } catch {
        throw new FitInputError("The selected JSON file is not valid JSON.");
      }
    } else if (extension === "csv" || extension === "tsv") {
      text = csvToText(contents, extension === "csv" ? "," : "\t");
    } else if (extension === "html" || extension === "htm") {
      text = extractHtmlText(contents);
    } else if (extension === "rtf") {
      text = rtfToText(contents);
    } else {
      text = contents;
    }
  }

  const jobDescription = sanitizeText(text, MAX_JOB_DESCRIPTION_LENGTH);
  if (!jobDescription) {
    throw new FitInputError("No readable job-description text was found, or the extracted text exceeds 12,000 characters.");
  }
  return jobDescription;
}

export async function readFitInput(request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json")) {
    const parsed = await readJsonBody(request, MAX_REQUEST_BYTES);
    if (parsed.error) throw new FitInputError(parsed.error, parsed.status);
    const { jobDescription, jobDescriptionUrl } = parsed.payload;
    if (Object.hasOwn(parsed.payload, "jobDescriptionUrl") && Object.hasOwn(parsed.payload, "jobDescription")) {
      throw new FitInputError("Provide a job description or a URL, not both.");
    }
    if (Object.hasOwn(parsed.payload, "jobDescriptionUrl")) {
      if (typeof jobDescriptionUrl !== "string") {
        throw new FitInputError("Enter a valid HTTPS job-description URL.");
      }
      const url = validateJobDescriptionUrl(jobDescriptionUrl);
      const page = await fetchPublicJobPage(url);
      const text = sanitizeText(page, MAX_JOB_DESCRIPTION_LENGTH);
      if (!text) throw new FitInputError("No readable job-description text was found at that URL.", 422);
      return text;
    }
    const text = sanitizeText(
      typeof jobDescription === "string" ? normalizeText(jobDescription) : null,
      MAX_JOB_DESCRIPTION_LENGTH,
    );
    if (!text) {
      throw new FitInputError(`Job description must contain 1–${MAX_JOB_DESCRIPTION_LENGTH} characters.`);
    }
    return text;
  }

  if (contentType.startsWith("multipart/form-data")) {
    const body = await readBodyBytes(request, MAX_REQUEST_BYTES);
    if (body.error) throw new FitInputError(body.error, body.status);
    let form;
    try {
      form = await new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: body.bytes,
      }).formData();
    } catch {
      throw new FitInputError("The uploaded form data is invalid.");
    }
    const file = form.get("file");
    const description = form.get("jobDescription");
    if (file instanceof File && description) {
      throw new FitInputError("Provide a job description or a file, not both.");
    }
    if (file instanceof File) {
      if (!file.name) throw new FitInputError("Choose a job-description file.");
      return extractJobDescriptionFile(file.name, Buffer.from(await file.arrayBuffer()));
    }
    const text = sanitizeText(
      typeof description === "string" ? normalizeText(description) : null,
      MAX_JOB_DESCRIPTION_LENGTH,
    );
    if (!text) {
      throw new FitInputError(`Job description must contain 1–${MAX_JOB_DESCRIPTION_LENGTH} characters.`);
    }
    return text;
  }

  throw new FitInputError("Content-Type must be application/json or multipart/form-data.", 415);
}
