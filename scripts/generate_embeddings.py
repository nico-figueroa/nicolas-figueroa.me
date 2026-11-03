"""Generate local OpenAI embeddings for the portfolio corpus."""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "data" / "corpus.json"
OUTPUT_PATH = ROOT / "data" / "embeddings.json"
API_URL = "https://api.openai.com/v1/embeddings"
BATCH_SIZE = 64


def request_embeddings(
    texts: list[str],
    api_key: str,
    model: str,
) -> list[list[float]]:
    """Request embeddings using the standard-library HTTP client."""
    request_body = json.dumps(
        {"model": model, "input": texts, "encoding_format": "float"}
    ).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload: dict[str, Any] = json.loads(response.read())
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Embedding service returned HTTP {error.code}.") from error
    except urllib.error.URLError as error:
        raise RuntimeError("Embedding service could not be reached.") from error

    data = sorted(payload["data"], key=lambda item: item["index"])
    vectors = [item["embedding"] for item in data]
    if len(vectors) != len(texts):
        raise RuntimeError("Embedding service returned an unexpected vector count.")
    return vectors


def generate(
    corpus: list[dict[str, str]],
    api_key: str,
    model: str,
) -> dict[str, Any]:
    """Generate vectors for every corpus chunk in bounded batches."""
    vectors: list[dict[str, Any]] = []
    for start in range(0, len(corpus), BATCH_SIZE):
        batch = corpus[start : start + BATCH_SIZE]
        batch_vectors = request_embeddings(
            [item["text"] for item in batch],
            api_key,
            model,
        )
        vectors.extend(
            {"id": item["id"], "vector": vector}
            for item, vector in zip(batch, batch_vectors, strict=True)
        )
    return {"model": model, "embeddings": vectors}


def main() -> None:
    """Validate configuration and write embeddings without exposing credentials."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=CORPUS_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("OPENAI_API_KEY is required to generate embeddings.")

    model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    corpus = json.loads(args.input.read_text(encoding="utf-8"))
    result = generate(corpus, api_key, model)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = args.output.with_suffix(f"{args.output.suffix}.tmp")
    temporary_path.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(args.output)
    print(f"Wrote {len(result['embeddings'])} embeddings to {args.output}")


if __name__ == "__main__":
    main()
