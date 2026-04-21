# Engineering Decisions

## 1. Backend NLP fallback strategy
- Decision: Keep Ollama as primary generator and add graceful tiered fallbacks.
- Why: Guarantees no paid API calls, while still producing output when Ollama is unavailable.
- Implementation: `nlpService.generateJson()` tries Ollama first, then fallback producer (heuristics). Transformers.js loading is lazy and optional.

## 2. SQLite with better-sqlite3
- Decision: Use `better-sqlite3` with startup migrations from `schema.sql`.
- Why: zero external infra, deterministic local tests, simple deployment.
- Tradeoff: synchronous query API, but acceptable for this local-first app and test speed.

## 3. Async upload processing with in-memory jobs
- Decision: `POST /api/upload` returns `jobId` immediately and processing runs async.
- Why: large files and question generation should not block request timeout.
- Tradeoff: job metadata is in-memory and resets on server restart.

## 4. PDF parsing and scanned-file handling
- Decision: Parse with `pdf-parse` and strip likely headers/footers via per-page short-line heuristics.
- Why: improves extracted signal for study content.
- Scanned PDFs: if no extractable text, return a clear 422 error indicating image-only/unsupported extraction.

## 5. Topic extraction algorithm
- Decision: lightweight TF-IDF phrase scoring + cosine cluster grouping.
- Why: no paid or heavy dependency required, good enough for academic notes.
- Enhancement path: can swap to embedding-based clustering later if needed.

## 6. Quiz generation policy
- Decision: minimum question density based on word count and hard cap of 50.
- Why: prevents tiny quizzes and protects backend from oversized generation.
- Deduplication: normalized question text check prevents duplicates across generations.

## 7. Flashcards and SM-2
- Decision: implement SM-2 from spec in `sm2.js` and persist interval/repetition/ease in DB.
- Why: deterministic spaced repetition behavior with auditability.
- UX detail: quality `0` card is re-queued in current session client-side for immediate reinforcement.

## 8. Weak topic scoring defaults
- Decision: no quiz attempts => `quizAccuracy = 0`; no flashcard reviews => `flashcardAvgQuality = 5`.
- Why: aligns with requested baseline where untouched topics score 0.6 rather than being penalized twice.

## 9. Frontend design system
- Decision: Fraunces + IBM Plex Mono with navy/cream/amber semantic palette.
- Why: academic notebook feel with clear contrast and readable dense content.
- Performance: no large component libraries; custom components with Tailwind utilities.

## 10. Testing strategy
- Decision: unit tests for core algorithms/services, integration tests against real SQLite, E2E with Playwright on full stack.
- Why: catches regressions across business logic, API contracts, and UI flow.

## 11. Schema fidelity
- Decision: Keep schema exactly as requested.
- Why: avoids drift between backend logic and expected reporting/stats calculations.

## 12. Caching/performance choices
- NLP availability cache: Ollama health check cached for 5s.
- Transformer model load: lazy, one-time per process.
- DB indexes: not added yet to keep baseline simple; recommended as next optimization for large datasets.
