# Rules for AI assistants (ChatGPT, Codex, other agents)

The owner develops the YNK Tech Hub in VS Code. Assistants contribute through pull requests only.
The `contribution-guard` check enforces the paths below on every pull request.

## How to contribute
1. Never push to `main`. Create a branch named `chatgpt/<short-topic>` and open a pull request to `main`.
2. One topic per pull request. Explain what changed and why in the description.
3. Never add the `scope-approved` label, merge your own pull request, or re-run checks to get around a failure.
4. Never put tokens, keys, passwords, sheet IDs of private data, or personal data in code, commits or pull requests.

## Scope
| Area | Assistant may |
| --- | --- |
| `ynk-react/public/intelligence/**` | Add or update article content and images (must pass `npm run validate:intelligence`) |
| `integrations/google-apps-script/*.gs`, `*.html` | Propose staging and publishing changes |
| `ynk-react/scripts/intelligence.mjs` | Propose validator changes |
| Anything else in `ynk-react/src/**`, other folders | Only after the owner adds `scope-approved` |
| `.github/**`, `AGENTS.md`, `ynk-react/vite.config.js` (CSP), `ynk-react/src/main.jsx`, `ynk-react/src/config/**`, `appsscript.json`, `.clasp*`, `Admin/**`, `CNAME`, `lambda/**`, `*.ps1`, `package.json`, `package-lock.json`, `.env*`, `.gitignore` | Never. These are owner-only |

## Content rules
- Articles normally flow from Google Drive (EN/FR/ES HTML trio) through YNK Staging, which converts them to
  `ynk-react/public/intelligence/articles/<slug>/{meta,en,fr,es}.json`. Prefer adding HTML trios to Drive over writing JSON by hand.
- Every article needs EN, FR and ES editions. No em dashes (U+2014) and no emoji anywhere in site copy.
- Images must be rights-cleared (credit required) or linked to their source, never copied.
- Editorial notes for staging (asset IDs, registry links, image guidance, test notes) go inside `<aside class="ynk-internal">...</aside>` or HTML comments. Staging drops them; anything else in the body is published.
- Clearly label proposals and prototypes as proposals; never present them as announced or deployed.

## Apps Script
Merged changes under `integrations/google-apps-script/` do not go live by themselves. The owner reviews them and
deploys from VS Code with `npm run gas:push`. Do not change OAuth scopes or web app access in `appsscript.json`.

## Before opening a pull request
From `ynk-react/`: `npm run validate:intelligence`, `npm run lint` (no new errors), `npm run build`.
