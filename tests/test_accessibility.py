"""Basic semantic accessibility checks for generated pages."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

DIST_DIR = Path(__file__).resolve().parents[1] / "dist"


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
