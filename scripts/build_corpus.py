"""Build source documents from verified portfolio content."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "src" / "content"
OUTPUT_PATH = ROOT / "data" / "source_content.json"


def _read_json(path: Path) -> Any:
    """Read a JSON file from the content directory."""
    with path.open(encoding="utf-8") as content_file:
        return json.load(content_file)


def _slug(value: str) -> str:
    """Return a stable identifier suitable for corpus documents."""
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _document(
    document_id: str,
    title: str,
    text: str,
    source: str,
) -> dict[str, str] | None:
    """Create a source document, excluding empty or uncited content."""
    normalized_text = " ".join(text.split())
    if not normalized_text or not source.startswith("https://"):
        return None
    return {
        "id": document_id,
        "title": title,
        "text": normalized_text,
        "source": source,
    }


def build_corpus(content_dir: Path = CONTENT_DIR) -> list[dict[str, str]]:
    """Collect verified profile, certification, and project content."""
    profile = _read_json(content_dir / "profile.json")
    site = _read_json(content_dir / "site.json")
    projects = _read_json(content_dir / "projects.json")
    documents: list[dict[str, str]] = []

    profile_documents = [
        ("profile-summary", "Professional profile", profile["summary"]),
        (
            "professional-experience",
            "Professional experience",
            " ".join(
                [
                    profile["experience"]["focus"],
                    "Industries: " + ", ".join(profile["experience"]["industries"]),
                    "Organizations: "
                    + ", ".join(profile["experience"]["organizations"]),
                    "Career history: "
                    + " ".join(
                        f'{position["title"]} at {position["organization"]}, '
                        f'{position["period"]}. {" ".join(position["highlights"])}'
                        for position in profile["experience"]["positions"]
                    ),
                ]
            ),
        ),
        (
            "technical-skills",
            "Technical skills and practices",
            " ".join(
                value for category in profile["skills"].values() for value in category
            )
            + " Spoken languages: "
            + " ".join(profile["spokenLanguages"]),
        ),
        ("learning", "Ongoing learning", profile["learning"]),
        (
            "education",
            "Education",
            " ".join(
                " — ".join(
                    part
                    for part in (
                        item["name"],
                        item["institution"],
                        item.get("period", ""),
                        item["detail"],
                    )
                    if part
                )
                for item in profile["education"]
            ),
        ),
        (
            "portfolio-introduction",
            "Portfolio introduction",
            f'{site["brandStatement"]} {site["introduction"]}',
        ),
    ]

    for document_id, title, text in profile_documents:
        item = _document(document_id, title, text, profile["source"])
        if item:
            documents.append(item)

    for certification in profile["certifications"]:
        credential = (
            f' Credential: {certification["credentialUrl"]}.'
            if certification.get("credentialUrl")
            else ""
        )
        item = _document(
            f'certification-{_slug(certification["name"])}',
            certification["name"],
            f'{certification["name"]}.{credential}',
            certification["source"],
        )
        if item:
            documents.append(item)

    for position in profile["experience"]["positions"]:
        item = _document(
            f'role-{_slug(position["organization"])}-{_slug(position["title"])}',
            f'{position["title"]} — {position["organization"]}',
            " ".join(
                [
                    position["period"],
                    position.get("location", ""),
                    *position["highlights"],
                ]
            ),
            profile["source"],
        )
        if item:
            documents.append(item)

    for education in profile["education"]:
        item = _document(
            f'education-{_slug(education["institution"])}-{_slug(education["name"])}',
            f'{education["name"]} — {education["institution"]}',
            " ".join(
                part
                for part in (
                    education.get("period", ""),
                    education.get("detail", ""),
                )
                if part
            ),
            profile["source"],
        )
        if item:
            documents.append(item)

    for project in projects:
        deployments = " ".join(
            f'Production deployment ({link["label"]}): {link["url"]}.'
            for link in project.get("productionLinks", [])
        )
        text = " ".join(
            part
            for part in (
                project["description"],
                f'Technologies: {", ".join(project["technologies"])}.',
                deployments,
            )
            if part
        )
        item = _document(
            f'project-{_slug(project["name"])}',
            project["name"],
            text,
            project["source"],
        )
        if item:
            documents.append(item)

    return documents


def main() -> None:
    """Write the source corpus used by the chunking step."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()
    documents = build_corpus()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(documents, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(documents)} source documents to {args.output}")


if __name__ == "__main__":
    main()
