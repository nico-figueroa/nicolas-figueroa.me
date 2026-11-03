# System Architecture

## Architecture Principles

### Simplicity First

Prefer simpler systems.

### Static First

Prefer static rendering.

### AI As Enhancement

Site must function without AI.

### Cost Awareness

Stay within free tiers whenever possible.

---

# Technology Stack

## Frontend

Astro

TailwindCSS

Vanilla JavaScript

## Backend

Python for content pipelines, corpus generation, and embedding preparation.

Node.js for stateless Netlify Functions. Netlify does not provide a Python Functions runtime; see ADR-005 in `DECISIONS.md`.

## AI

OpenAI API

## Hosting

Netlify

## Source Control

GitHub

---

# High Level Architecture

Browser

↓
Astro Frontend

↓
Netlify Static Hosting

↓
Node.js Netlify Functions

↓
OpenAI API

Python local content pipeline → JSON corpus and embeddings → Netlify build/deployment

---

# Data Sources

Resume

Projects

Journey

GitHub profile and repositories

LinkedIn URL (profile content pending independent verification)

YouTube Metadata

Future Transcripts

---

# Deployment

GitHub Push

↓

Netlify Build

↓

Production Deployment