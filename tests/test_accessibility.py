"""Basic semantic accessibility checks for generated pages."""

from __future__ import annotations

import json
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DIST_DIR = Path(__file__).resolve().parents[1] / "dist"
ROOT_DIR = Path(__file__).resolve().parents[1]


class PageSemantics(HTMLParser):
    """Collect key landmarks and label associations from a static page."""

    def __init__(self) -> None:
        super().__init__()
        self.has_language = False
        self.has_main = False
        self.has_skip_link = False
        self.labels: set[str] = set()
        self.textarea_ids: set[str] = set()
        self.control_ids: set[str] = set()
        self.control_names: set[str] = set()
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.forms: list[dict[str, str | None]] = []
        self._text = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "html":
            self.has_language = bool(attributes.get("lang"))
        if tag == "main" and attributes.get("id") == "main":
            self.has_main = True
        if tag == "a" and attributes.get("href") == "#main":
            self.has_skip_link = True
        if attributes.get("id"):
            self.ids.add(attributes["id"])
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"])
        if tag == "label" and attributes.get("for"):
            self.labels.add(attributes["for"])
        if tag == "form":
            self.forms.append(attributes)
        if tag in {"input", "textarea"}:
            if attributes.get("id"):
                self.control_ids.add(attributes["id"])
            if attributes.get("name"):
                self.control_names.add(attributes["name"])
        if tag == "textarea" and attributes.get("id"):
            self.textarea_ids.add(attributes["id"])
        self._text = ""

    def handle_data(self, data: str) -> None:
        self._text += data


def test_generated_pages_have_language_landmarks_and_skip_links() -> None:
    """Every static route declares its language, main landmark, and skip link."""
    pages = list(DIST_DIR.rglob("index.html"))
    assert pages, "Run the site build before the accessibility test."

    for path in pages:
        parser = PageSemantics()
        parser.feed(path.read_text(encoding="utf-8"))
        assert parser.has_language, path
        assert parser.has_main, path
        assert parser.has_skip_link, path
        assert parser.control_ids <= parser.labels, path


def test_contact_page_has_labeled_netlify_form_fields() -> None:
    """The deployed contact page exposes the Netlify form with labeled fields."""
    path = DIST_DIR / "contact" / "index.html"
    parser = PageSemantics()
    parser.feed(path.read_text(encoding="utf-8"))

    assert any(
        form.get("name") == "contact"
        and form.get("method") == "POST"
        and form.get("data-netlify") == "true"
        for form in parser.forms
    )
    assert {"name", "email", "message"} <= parser.control_names
    assert parser.control_ids <= parser.labels


def test_internal_links_and_published_pdf_routes_resolve() -> None:
    """Every generated same-site link and evidence PDF points to a built artifact."""
    for path in DIST_DIR.rglob("index.html"):
        parser = PageSemantics()
        parser.feed(path.read_text(encoding="utf-8"))
        for href in parser.links:
            parts = urlsplit(href)
            if parts.scheme or parts.netloc or not parts.path.startswith("/"):
                continue
            relative_path = unquote(parts.path.lstrip("/"))
            target = (
                DIST_DIR / relative_path / "index.html"
                if not relative_path or parts.path.endswith("/")
                else DIST_DIR / relative_path
            )
            assert target.is_file(), f"{path}: broken internal link {href}"
            if parts.fragment and target.name == "index.html":
                target_parser = PageSemantics()
                target_parser.feed(target.read_text(encoding="utf-8"))
                assert parts.fragment in target_parser.ids, f"{path}: missing fragment {href}"

    evidence = json.loads(
        (ROOT_DIR / "src" / "content" / "evidence.json").read_text(encoding="utf-8")
    )
    for record in evidence:
        published = DIST_DIR / "evidence" / f'{record["id"]}.pdf'
        source = ROOT_DIR / "src" / "content" / record["file"]
        assert published.is_file(), f'Missing published PDF for {record["id"]}'
        assert published.read_bytes() == source.read_bytes(), record["id"]


def test_certification_cards_share_newest_first_order_and_about_omits_evidence() -> None:
    """Every certification display uses the same complete card order."""
    profile = json.loads(
        (ROOT_DIR / "src" / "content" / "profile.json").read_text(encoding="utf-8")
    )
    names = [item["name"] for item in profile["certifications"]]
    dates = [item["issuedOn"] for item in profile["certifications"] if item.get("issuedOn")]
    assert dates == sorted(dates, reverse=True)
    pages = [
        DIST_DIR / "journey" / "index.html",
        *sorted((DIST_DIR / "resume").glob("*/index.html")),
    ]
    for path in pages:
        html = path.read_text(encoding="utf-8")
        assert "data-certification-cards" in html, path
        positions = [html.index(f">{name}</h3>") for name in names]
        assert positions == sorted(positions), path
        for credential in profile["certifications"]:
            for date_field in ("issuedOn", "expiresOn"):
                if credential.get(date_field):
                    assert f'datetime="{credential[date_field]}"' in html, (path, credential)
            if credential.get("detail"):
                assert escape(credential["detail"], quote=False) in html, (path, credential)
        assert "résumé" not in html.lower(), path
    about = (DIST_DIR / "about" / "index.html").read_text(encoding="utf-8")
    assert "Selected outcomes" not in about
    assert "Evidence library" not in about
    assert "Certifications and training" not in about
    assert "data-certification-cards" not in about
    about_content = json.loads(
        (ROOT_DIR / "src" / "content" / "about.json").read_text(encoding="utf-8")
    )
    for entry in about_content["timeline"]:
        for field in ("period", "title", "description"):
            assert escape(entry[field], quote=False) in about, (entry, field)
    experience = (DIST_DIR / "experience" / "index.html").read_text(encoding="utf-8")
    assert "Selected outcomes" in experience


def test_resume_skill_cards_emphasize_transferable_process_improvement() -> None:
    """Process-focused cards render their shared skills without industry headings."""
    content = ROOT_DIR / "src" / "content"
    profile = json.loads((content / "profile.json").read_text(encoding="utf-8"))
    resume = json.loads((content / "resume.json").read_text(encoding="utf-8"))
    headings = {
        "processSimplification": "Process design and simplification",
        "continuousImprovement": "Continuous improvement",
    }

    for view in resume["views"]:
        html = (DIST_DIR / "resume" / view["slug"] / "index.html").read_text(encoding="utf-8")
        assert ">Quality systems</h3>" not in html, view["slug"]
        assert ">Medical-device experience</h3>" not in html, view["slug"]
        assert "ISO 9001" not in html, view["slug"]
        assert "ISO 13485" not in html, view["slug"]
        assert "ISO 22716" not in html, view["slug"]
        for group, heading in headings.items():
            if group in view["skillGroups"]:
                assert f">{heading}</h3>" in html, view["slug"]
        for group in view["skillGroups"]:
            if group == "spokenLanguages":
                continue
            skills = profile["skills"][group]
            if group in view["skillFilters"]:
                skills = [skill for skill in skills if skill in view["skillFilters"][group]]
            for skill in skills:
                assert f'alt="{escape(skill, quote=True)}"' in html, (view["slug"], skill)
