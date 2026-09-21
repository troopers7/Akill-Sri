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

## Automatic enquiry delivery (one-time setup)

Submitting the six-step planner sends the brief straight to the studio owners — no pop-up and no "tap send" for the visitor:

| Channel | Service | One-time activation |
| --- | --- | --- |
| Email to both owners | [formsubmit.co](https://formsubmit.co) | Submit the planner once. The first brief mails a confirmation link to `akilanmaneesha@gmail.com`; click it once and every later submission is delivered automatically (the second owner address travels on the CC line). |
| WhatsApp `+91 97902 24561` / `+91 99402 95932` | [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) | On each number: save the bot `+34 623 78 95 80`, send it the WhatsApp text *I allow callmebot to send me messages*, then paste the APIKEY it replies with into `OWNER_WHATSAPP` inside `src/utils/notify.js`. |

All contacts and endpoints live at the top of `src/utils/notify.js` (`OWNER_EMAILS`, `OWNER_WHATSAPP`, `EMAIL_DELIVERY`).

Submitting therefore always delivers something, with no dead ends:

1. Each owner number still missing its callmebot apikey gets its WhatsApp chat opened with the finished brief already written — the same behaviour as most studio enquiry forms. Set `WHATSAPP_DEEPLINK_FALLBACK = false` in `src/utils/notify.js` once both apikeys are in place for a fully silent hand-off.
2. The email brief is POSTed silently to formsubmit.co for both owners.
3. The review screen reports every channel — "Sent automatically ✓", "WhatsApp opened — press send", or a tap-to-send link — so an enquiry is never lost.

## Notes

- The planner runs in the browser and uploads no files (only the reference filename is included in the brief); the draft lives in memory until the page is refreshed.
- On submit the brief is pushed to the two services above and the review screen reports the live result for each channel.