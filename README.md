# Cencora Customer Workspace (PortalR1)

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
