# anki

Monorepo managed by `pnpm` that contains both the Hono backend and the Vite React frontend.

## Packages

- `apps/api`: Hono API server.
- `apps/web`: Vite React client.

## Useful scripts

- `pnpm dev:backend` – start the backend with hot reload via `tsx`.
- `pnpm dev:frontend` – launch the Vite dev server for the frontend.
- `pnpm build` – build all workspace packages.

Install dependencies once with `pnpm install` and then run the scripts as needed.
