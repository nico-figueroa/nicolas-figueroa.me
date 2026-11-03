# Testing Strategy

## Unit Testing

Python functions

Similarity search

Prompt generation

Job analysis logic

---

# Integration Testing

AI Guide end-to-end

Fit Analysis end-to-end

Deployment verification

---

# UI Testing

Navigation

Mobile responsiveness

Dark mode

Accessibility

---

# Performance Testing

Lighthouse

Page speed

Core Web Vitals

---

# Security Testing

Prompt injection validation

Input sanitation

Rate limiting

Environment variable isolation

---

# Regression Testing

All critical user journeys before release.

## Local commands

- `npm test` runs JavaScript content, retrieval, and endpoint tests.
- `npm run test:node-coverage` runs Node's built-in coverage report.
- `npm run build` generates static routes.
- `python -m pytest --cov=scripts --cov-report=term-missing --cov-report=xml --cov-report=html` runs Python pipeline and generated-page accessibility tests after a build and writes `coverage.xml` and `htmlcov/`.
- `npm run test:all` runs the build, Node tests with coverage, and Python tests with coverage.