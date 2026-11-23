# Cencora Customer Workspace (PortalR1)

Release 1: thin slice, fully connected experience. Scope follows the Release 1 slide and is switched in `src/lib/release.ts`
(Depot/Storage, voice, chat and call support, onboarding tour and the upsell catalogue are off; Brokerage (OK to Send) is on).

Brokerage: `/brokerage` lists every cross-border shipment with the Customs brokerage add-on (exports and imports), `/brokerage/:job`
is the self-service workspace per shipment: OK to Send tracker, destination document checklist with instant checks, messages with the
broker, customs entry and activity. Data lives in `src/data/brokerage.ts`, state and scripted review in `src/lib/brokerage.ts`.

Future-state vision of the Cencora World Courier customer portal, rebuilt as a clean, uncluttered workspace.

- `main` holds the source (React 18, TypeScript, Vite, HashRouter, Zustand, Lucide, jsPDF).
- `gh-pages` holds the built site served at https://nathanurquhartuk-cloud.github.io/PortalR1/

## Develop

```bash
npm install
npm run dev        # http://localhost:3000/PortalR1/
npm run typecheck
npm run build      # outputs dist/
```

## Deploy

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

Illustrative data only; no live operational or financial systems are connected.
