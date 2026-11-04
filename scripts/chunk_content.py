"""Chunk source documents and write corpus and citation metadata artifacts."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "data" / "source_content.json"
CORPUS_PATH = ROOT / "data" / "corpus.json"
METADATA_PATH = ROOT / "data" / "metadata.json"


def chunk_text(text: str, size: int = 180, overlap: int = 30) -> list[str]:
    """Split text by words with a bounded overlap between adjacent chunks."""
    if size < 1 or overlap < 0 or overlap >= size:
        raise ValueError("size must be positive and overlap must be smaller than size")
    words = text.split()
    if not words:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = end - overlap
    return chunks


def chunk_documents(
    documents: list[dict[str, Any]],
    size: int = 180,
    overlap: int = 30,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Return chunk text and its source-citation metadata."""
    corpus: list[dict[str, str]] = []
    metadata: list[dict[str, str]] = []
    for document in documents:
        for index, text in enumerate(
            chunk_text(document["text"], size=size, overlap=overlap)
        ):
            chunk_id = f'{document["id"]}-{index:03d}'
            corpus.append({"id": chunk_id, "text": text})
            metadata.append(
                {
                    "id": chunk_id,
                    "title": document["title"],
                    "source": document["source"],
                }
            )
    return corpus, metadata


def _write_json(path: Path, content: Any) -> None:
    """Write JSON atomically so a failed run cannot truncate a valid artifact."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    temporary_path.write_text(
        json.dumps(content, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    temporary_path.replace(path)


def main() -> None:
    """Read source content and write chunk and metadata artifacts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=INPUT_PATH)
    parser.add_argument("--corpus", type=Path, default=CORPUS_PATH)
    parser.add_argument("--metadata", type=Path, default=METADATA_PATH)
    parser.add_argument("--size", type=int, default=180)
    parser.add_argument("--overlap", type=int, default=30)
    args = parser.parse_args()
    documents = json.loads(args.input.read_text(encoding="utf-8"))
    corpus, metadata = chunk_documents(documents, args.size, args.overlap)
    _write_json(args.corpus, corpus)
    _write_json(args.metadata, metadata)
    print(f"Wrote {len(corpus)} chunks and citation records.")


if __name__ == "__main__":
    main()
