# Akill-Sri

Sri Akil — Temple Architecture & Sculptures studio website.

A Vite-based single-page application showcasing South Indian temple architecture: project portfolio with search and filters, interactive temple anatomy explorer, 8-stage process timeline, heritage journal with article reader, and a six-step project planner that prepares a downloadable brief locally.

## Tech Stack

- Vite 5 (dev server & production builds)
- Vanilla JavaScript ES modules (hash-based SPA routing)
- Hand-written CSS with a sage green & bronze design system
- Playwright browser tests (`tests/browser`)

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Tests

```bash
npx playwright test
```

Tests cover all routes at multiple viewport widths, navigation, search, keyboard accessibility, and the full project planner flow.

## Notes

- The project planner runs entirely in the browser: nothing is submitted to a backend, and no files are uploaded. Refreshing the page clears the draft.