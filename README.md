# Chore Wars

Universal React Native + Expo Router app with Expo Router API routes (`+api.ts`) deployed to Vercel.

> The original Express + Handlebars starter is preserved in git history under the `legacy-express` tag.

## Project Structure

```text
chorewars/
├── api/                    # Vercel serverless entrypoint bridging to dist/server
├── assets/images/          # App icons and original cw-logo-splash.png
├── src/
│   ├── app/                # Expo Router routes & API endpoints (src/app/api/*+api.ts)
│   ├── components/         # Reusable UI components (each with a paired .styles.ts file)
│   ├── constants/          # Shared theme tokens (Colors, Spacing, Radius, Typography)
│   ├── lib/                # Client helpers (API URL resolution, etc.)
│   └── screens/            # Screen components (each with a paired .styles.ts file)
├── app.json                # Expo config (web.output: "server")
└── vercel.json             # Vercel build, output, and API rewrite config
```

## Running Locally

```bash
npm install
npm start        # Expo dev server (iOS, Android, Web + /api/* routes)
npm run web      # Launch directly in browser
npm run typecheck
npm run build:web
```

## API Routes & Vercel Deployment

- Add backend endpoints under `src/app/api/` using the `+api.ts` suffix (for example, `src/app/api/health+api.ts` serves `GET /api/health`).
- In production on Vercel, `vercel.json` builds with `npx expo export -p web` and routes requests through `api/index.js` using the Expo Server Vercel adapter.
- For mobile devices talking to a deployed Vercel backend, set `EXPO_PUBLIC_API_URL=https://your-app.vercel.app`.
