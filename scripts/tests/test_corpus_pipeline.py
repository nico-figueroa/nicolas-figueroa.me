"""Tests for corpus creation, chunking, and embedding preparation."""

from __future__ import annotations

from unittest.mock import patch

from scripts.build_corpus import CONTENT_DIR, build_corpus
from scripts.chunk_content import chunk_documents, chunk_text
from scripts.generate_embeddings import generate


def test_corpus_contains_sourced_profile_and_project_content() -> None:
    """Only content with explicit HTTPS citations enters the corpus."""
    documents = build_corpus(CONTENT_DIR)
    by_id = {document["id"]: document for document in documents}

    assert "profile-summary" in by_id
    assert "project-ai-trip-planner" in by_id
    assert "project-intakewise" in by_id
    assert "professional-experience" in by_id
    assert "role-philips-safety-quality-and-regulatory-leader" in by_id
    assert "https://intakewise.onrender.com" in by_id["project-intakewise"]["text"]
    assert (
        "https://www.linkedin.com/in/nicolas-figueroa-hidalgo"
        in by_id["professional-experience"]["source"]
    )
    assert (
        "https://www.linkedin.com/in/nicolas-figueroa-hidalgo"
        in by_id["profile-summary"]["source"]
    )
    assert all(
        document["source"].startswith(("https://", "/"))
        for document in documents
    )
    assert "evidence-wes-report" in by_id
    assert by_id["evidence-wes-report"]["source"] == "/evidence/wes-report.pdf"
    assert "evidence-presentation-process-variation" in by_id
    assert by_id["about-timeline-2000-2003"]["source"] == "/about/"
    assert "Linux servers" in by_id["about-timeline-2000-2003"]["text"]


def test_chunk_text_overlaps_without_losing_words() -> None:
    """Overlapping chunks preserve text coverage in order."""
    chunks = chunk_text("one two three four five six", size=4, overlap=1)

    assert chunks == ["one two three four", "four five six"]
    assert chunk_text("", size=4, overlap=1) == []


def test_corpus_preserves_positioning_and_credential_scope() -> None:
    """Public retrieval keeps the merged approach and sourced credential context."""
    by_id = {document["id"]: document for document in build_corpus(CONTENT_DIR)}
    badge = by_id["certification-microsoft-pro-badge-github-copilot-proficient"]

    assert "Business Systems Thinker" in by_id["profile-summary"]["text"]
    assert "simplifying processes" in by_id["about-narrative"]["text"]
    assert "tools they already own" in by_id["about-narrative"]["text"]
    assert by_id["portfolio-introduction"]["source"] == "/"
    assert "Issuer: Microsoft." in badge["text"]
    assert "Issued / completed: 2026-11-16." in badge["text"]
    assert "Expires: 2027-05-16." in badge["text"]
    assert "not an exam-based Microsoft certification" in badge["text"]
    assert badge["source"].startswith("https://www.credly.com/badges/")
    assert "Issued / completed:" not in by_id["certification-itil-v3-training"]["text"]
    assert "Agile" in by_id["evidence-resume-pdf"]["text"]
    assert "AWS and Azure fundamentals" in by_id["evidence-resume-pdf"]["text"]


def test_chunk_text_rejects_invalid_overlap() -> None:
    """Chunk configuration must always make forward progress."""
    try:
        chunk_text("text", size=4, overlap=4)
    except ValueError as error:
        assert "overlap" in str(error)
    else:
        raise AssertionError("Invalid overlap was accepted")


def test_chunk_documents_preserves_source_metadata() -> None:
    """Every chunk keeps a stable source-citation record."""
    documents = [
        {
            "id": "sample",
            "title": "Sample",
            "text": "one two three four five",
            "source": "https://example.test/source",
        }
    ]

    corpus, metadata = chunk_documents(documents, size=3, overlap=1)

    assert [item["id"] for item in corpus] == ["sample-000", "sample-001"]
    assert all(item["source"] == documents[0]["source"] for item in metadata)


def test_generate_batches_and_keeps_embedding_ids() -> None:
    """Embedding generation maps each returned vector to its corpus id."""
    corpus = [
        {"id": "one", "text": "first"},
        {"id": "two", "text": "second"},
    ]
    with patch(
        "scripts.generate_embeddings.request_embeddings",
        return_value=[[1.0, 0.0], [0.0, 1.0]],
    ):
        result = generate(corpus, "test-key-not-used-for-network", "test-model")

    assert result["model"] == "test-model"
    assert result["embeddings"] == [
        {"id": "one", "vector": [1.0, 0.0]},
        {"id": "two", "vector": [0.0, 1.0]},
    ]
