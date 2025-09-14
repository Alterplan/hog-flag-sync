hog-flag-sync
================

Sync PostHog Toolbar feature‑flag overrides from the browser to your Next.js server so SSR and API logic match what you see in the Toolbar. Includes a PostHog Node monkey patch that keeps original behavior while honoring overrides first.

Why this exists
---------------

- When using the PostHog Toolbar, you can override flags on the client. Server code (SSR/API) doesn’t know about those overrides by default.
- This bridge syncs the client’s current flags and payloads into a cookie, and provides server helpers/a patched client that reads those overrides before calling PostHog.

Requirements
------------

- Next.js App Router (uses `next/headers` cookies API)
- React 19+
- `posthog-js` on the client and `posthog-node` on the server
- Env vars: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
-  `posthog-js` (client-side) initialized in your app [Official Posthog docs](https://posthog.com/docs/libraries/next-js)


Install
-------

This package is publicly available via GitHub Packages under the `@alterplan` scope.

Configure npm to use GitHub Packages for the `@alterplan` scope by adding an `.npmrc` at your project root (or in your user home):

```
# .npmrc
@alterplan:registry=https://npm.pkg.github.com
```

Then install the package:

```
npm i @alterplan/hog-flag-sync
```

Quick start
-----------

1) API route (App Router) with env guard

Create `app/api/hfs/override/route.ts` in your app and gate the handlers with `NEXT_PUBLIC_HFS_ENABLED`:

```ts
// app/api/hfs/override/route.ts
import { NextResponse } from "next/server";
import {
  handleOverridePOST as realPOST,
  handleOverrideDELETE as realDELETE,
} from "@alterplan/hog-flag-sync";

const enabled =
  process.env.NEXT_PUBLIC_HFS_ENABLED === "1" ||
  (process.env.NEXT_PUBLIC_HFS_ENABLED == null &&
    process.env.NODE_ENV !== "production");

export async function POST(req: Request) {
  if (!enabled) return NextResponse.json({ ok: false }, { status: 404 });
  return realPOST(req);
}

export async function DELETE() {
  if (!enabled) return NextResponse.json({ ok: false }, { status: 404 });
  return realDELETE();
}
```

2) Add the dev bridge (client) to sync flags → server

Place the toolbar sync bridge in a root layout (or a top-level client component). 

By default, it is enabled only in non‑production (`process.env.NODE_ENV !== "production"`).

You can control enable/disable by environment variable `NEXT_PUBLIC_HFS_ENABLED` or directly with the `enabled` prop:

```tsx
// app/layout.tsx (example)
import { PostHogToolbarSyncBridge } from "@alterplan/hog-flag-sync";

const enabled =
  process.env.NEXT_PUBLIC_HFS_ENABLED === "1" ||
  (process.env.NEXT_PUBLIC_HFS_ENABLED == null &&
    process.env.NODE_ENV !== "production");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PostHogToolbarSyncBridge enabled={enabled} />
      </body>
    </html>
  );
}
```

Optional: you can still override per-instance using the `enabled` prop directly:

```tsx
<PostHogToolbarSyncBridge enabled={false} />
```


3) Use the PostHog client on the server (env toggle)

Use the patched PostHog client in your server code (SSR, API routes, etc). 

```ts
// lib/posthog-server.ts
import { PostHog } from "posthog-node";
import { createPatchedPostHog } from "@alterplan/hog-flag-sync";

const enabled =
  process.env.NEXT_PUBLIC_HFS_ENABLED === "1" ||
  (process.env.NEXT_PUBLIC_HFS_ENABLED == null &&
    process.env.NODE_ENV !== "production");

if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  throw new Error("Missing NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST");
}

export const posthog = enabled
  ? createPatchedPostHog()
  : new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
```


What the bridge does
--------------------

- On the client: listens for Toolbar flag changes and POSTs the full set of current `flags` and `payloads` to `/api/hfs/override`.
- On the server: stores them in a cookie (`hfs_server_flag_overrides`) and exposes helpers/monkey‑patched PostHog methods that look up overrides first, then fall back to the real PostHog Node methods.

 

API Reference
-------------

- `PostHogToolbarSyncBridge({ enabled?: boolean; apiURL: string; debounceMs?: number })`
  - Client component that auto-syncs Toolbar overrides to the server. 
  - `apiURL` defaults to `/api/hfs/override`.
  - `enabled`: defaults to `process.env.NODE_ENV !== "production"`.
  - `debounceMs`: debounce delay for sending updates. Default: `500`.
- `syncServerOverridesAll(apiURL: string)`
  - Client helper to push the current flags/payloads to the server on demand.
- `createPatchedPostHog(apiKey?: string, options?: object)`
  - Returns a `posthog-node` client whose `getFeatureFlag`, `getFeatureFlagPayload`, and `getAllFlags` read overrides first.
- `handleOverridePOST`, `handleOverrideDELETE`
  - Next.js `app/` API route handlers to set/clear the overrides cookie.
- `COOKIE_NAME`, `readOverrides()`, `writeOverrides()`, `clearOverrides()`
  - Server utilities for advanced control.


Cookie & Security Notes
-----------------------

- Cookie name: `hfs_server_flag_overrides`. Scoped to `/`.
- The cookie content is user-scoped. Posting to the route only affects the caller’s cookie.

Troubleshooting
---------------

- Missing key: ensure `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are set.
- App Router is required: the package uses `next/headers` cookies; Pages Router won’t work.
- Distinct ID: you must pass the correct `distinctId` to server methods (from your auth/user model).

License
-------

MIT License. See [LICENSE](LICENSE).
