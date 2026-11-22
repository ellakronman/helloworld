# Caption Fight Club

Consumer app: upload a photo, generate four AI captions, review and save them, then vote in the Arena. The separate admin application is not part of this repository.

## Local development

Use a supported Node.js LTS release (Node 22.13+ or 24+) and the locked dependencies:

```sh
npm ci
npm run dev
```

Set these variables in an ignored `.env.local` file. Never commit their values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `OPENAI_API_KEY` (server only)
- `BLOB_READ_WRITE_TOKEN` (server only)

The public key and service key must belong to the same Supabase project. Public images are stored in Vercel Blob; the app does not use Supabase Storage for these uploads. Keep Production and Preview environment scopes configured in Vercel.

## Consumer flow

- `/`: public homepage and Google sign-in. Redirect destination is the current browser origin plus `/auth/callback`.
- `/auth/callback`: exchanges the PKCE code and sends users with incomplete names to `/profile`.
- `proxy.ts`: refreshes session cookies before rendering authenticated pages. API handlers verify users independently.
- `/profile`: saves the existing user's profile under their authenticated RLS permissions.
- `/upload`: accepts JPG, PNG or WebP files up to 4 MB, shows generated captions for review, and saves only on explicit submission.
- `/api/caption-image`: uploads to Vercel Blob.
- `/api/describe-image`: image → factual description using OpenAI.
- `/api/generate-captions`: description → four captions using OpenAI.
- `/api/save-generation`: verifies a server-signed, user-bound generation receipt before inserting the image and captions. Receipts expire after 24 hours. The signing key stays server-side.
- `/arena`: displays persisted images/captions/scores. A database outage is shown as an error, not an empty Arena. Saved generations link to their fight's anchor.
- `lib/voting.ts`: INSERT for a first vote, UPDATE for a switch, DELETE when selecting the same vote again. Each mutation must return exactly one row before the UI reports success.

Database tables referenced by application code: `images`, `captions`, `votes`, `profiles`. Optional audit logging uses `generation_requests` and `llm_responses`. Check the live schema and RLS before migrations; do not infer shared admin permissions from this app.

## Verification

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run start
```

The Node tests cover vote transitions, denied/zero-row mutations, changed sessions, image validation, and signed-generation tampering/expiry. They use test doubles and do not establish that live RLS works.

Before recording, exercise Google sign-in, profile saving, a real image upload, real AI generation, review/save, both vote directions, switching, undo, and a full refresh. Confirm the underlying rows as well as the button appearance. Test the same immutable deployment URL that will be submitted.

## Deployment investigation — 22 November 2026

The Vercel dashboard identified repository `ellakronman/helloworld`, project `ella-28eb/helloworld`:

| Existing deployment | Branch / commit | Immutable URL |
| --- | --- | --- |
| Production alias `helloworld-sooty-tau.vercel.app` | `main` / `98a3c2e88f263d48bb5e5ed9298cb2ca3de8bbe2` | https://helloworld-oo5e0h3lw-ella-28eb.vercel.app |
| Latest existing preview | `ux-redesign` / `4474801c24dd85fc74e6e13af26ca09f83859262` | https://helloworld-6j1mfr1mq-ella-28eb.vercel.app |

Production was missing the Undo Vote changes already present in the preview branch. Its Supabase project `helloworld` (`dwvolrrlyqarquvjyyrv`) was paused. Vercel runtime logs showed DNS/auth/database fetch failures, while the old Arena displayed “NO FIGHTS YET.” Resuming that project was explicitly approved and requested through the dashboard; wait for healthy services before testing persistence.

Repairs are developed on `codex/consumer-flow-repair`, based on the latest `ux-redesign`, preserving its design/profile improvements. The URLs above refer to earlier code, not these repairs.

OAuth configuration must be inspected in this project's Authentication → URL Configuration. The intended production Site URL is `https://helloworld-sooty-tau.vercel.app`; the allowed redirects must include `https://helloworld-sooty-tau.vercel.app/auth/callback`, the exact tested preview callback, and any local callback used for testing. Do not replace these settings based on assumptions or broaden access unnecessarily.

Remaining live checks include actual table constraints/RLS, a first-time profile, credential validity, concurrent/ambiguous save retries (image and caption writes are currently separate requests), pagination beyond Supabase row limits, and the complete authenticated recording flow. The current code prevents repeated clicks but does not yet establish transaction-level save idempotency.

Compatible dependency security updates moved Next.js from 16.3.8 to 16.4.6 in the lockfile. Four high advisories remain in the transitive `@vercel/blob → @vercel/oidc → @vercel/cli-config → zod` chain; npm proposes a forced Blob downgrade, which was not applied. Reassess that dependency path before wider release.
