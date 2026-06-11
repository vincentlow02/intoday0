# IntoDay UI Prototype

Standalone frontend-only prototype of IntoDay for design presentations and user testing.

This repository intentionally has no Supabase, authentication, database, backend API routes, analytics, or server-side conversion logic. Data is seeded from local mock JSON and then persisted in `localStorage` during the browser session.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Reset mock data

Clear the browser key `intoday_ui_prototype_tasks` from `localStorage`, then reload the page.
