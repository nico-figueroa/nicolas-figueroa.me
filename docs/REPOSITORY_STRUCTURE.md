# Repository Structure

```text
nicolas-figueroa.me/
├── data/
│   ├── corpus.json
│   ├── embeddings.json
│   └── metadata.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── IMPLEMENTATION.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── TECHNICAL_SPECIFICATION.md
├── functions/
│   ├── ai-guide.mjs
│   └── check-nicos-fit.mjs
├── public/
├── scripts/
│   ├── build_corpus.py
│   ├── chunk_content.py
│   ├── generate_embeddings.py
│   └── tests/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   ├── pages/
│   ├── server/
│   └── styles/
├── tests/
├── .env.example
├── netlify.toml
├── package.json
└── requirements.txt
```

The Netlify Functions use Node.js as documented in ADR-005. Python scripts build the local corpus and embeddings; `data/source_content.json` is an ignored intermediate artifact.
