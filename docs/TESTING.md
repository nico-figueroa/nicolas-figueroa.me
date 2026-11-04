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

The repository's pytest configuration disables the unused AnyIO and LangSmith
plugins, which may be installed in a shared Python environment. Pytest coverage
remains enabled, and warnings from project code and other dependencies remain visible.

## AI Guide handler coverage

`tests/ai-guide.test.mjs` covers request validation, rate limiting, configuration
validation, no-evidence responses, cited answers, and AI-service failure fallbacks.
OpenAI requests are mocked and environment variables are restored after each test;
no credentials or live API calls are required.

Run the focused suite with a handler-specific coverage gate:

```shell
node --test --experimental-test-coverage --test-coverage-include="functions/ai-guide.mjs" --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 tests/ai-guide.test.mjs
```