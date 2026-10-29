# Vercel Deployment Checklist

Use this checklist for the first production deployment and future environment changes.

## 1. Preflight

- [ ] Run `npm ci`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run eval` and review `eval/results.md`.
- [ ] Confirm `.env.local` is ignored: `git check-ignore .env.local`.
- [ ] Confirm no real secret appears in Git history or staged changes.
- [ ] Apply `supabase/migrations/20261029000100_initial_rag_schema.sql` to the production Supabase project.
- [ ] Confirm `documents`, `chunks`, the HNSW index, RLS policies, and `match_chunks` exist.

## 2. External services

### Google Gemini

- [ ] Create or select a production API key.
- [ ] Confirm the configured chat and embedding models are available to that project.
- [ ] Review model quotas so chat and evaluation traffic do not share an unexpectedly low limit.

### Supabase

- [ ] Keep the service-role key server-side only.
- [ ] Configure custom SMTP and test a magic-link email.
- [ ] Use the token-hash magic-link template documented in the README.
- [ ] Keep the Storage bucket private with an 8 MB PDF limit.
- [ ] Record the Supabase project region for the Vercel region decision.

### Upstash

- [ ] Create a production Redis database.
- [ ] Copy its REST URL and REST token.
- [ ] Confirm the database region is reasonably close to the Vercel Function Region.

## 3. Import into Vercel

- [ ] In Vercel, select **Add New → Project**.
- [ ] Import `MirajHossain22/RAG-chat` from GitHub.
- [ ] Keep the detected framework as **Next.js**.
- [ ] Keep the repository root as the project root.
- [ ] Confirm Node.js 22 or newer is selected; `package.json` declares this requirement.

## 4. Environment variables

Add these in **Project → Settings → Environment Variables** for Production. Add them to Preview only if preview deployments should access non-production services.

- [ ] `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] `GOOGLE_CHAT_MODEL`
- [ ] `GOOGLE_EMBEDDING_MODEL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

Do not add actual values to `.env.example`, README files, screenshots, build logs, or client-visible variables.

## 5. Functions

- [ ] In **Project → Settings → Functions**, enable Fluid Compute.
- [ ] Set the Function Region nearest the Supabase project region to reduce database and Storage latency.
- [ ] Confirm `app/api/chat/route.ts` exports `maxDuration = 120`.
- [ ] Confirm `app/api/ingest/route.ts` exports `maxDuration = 300`.
- [ ] On the Hobby plan, keep ingestion at or below the current 300-second Fluid Compute maximum.

Suggested Vercel/Supabase proximity examples:

| Supabase location | Candidate nearby Vercel region |
| --- | --- |
| North Virginia | Washington, D.C. (`iad1`) |
| Frankfurt | Frankfurt (`fra1`) |
| London | London (`lhr1`) |
| Singapore | Singapore (`sin1`) |
| Mumbai | Mumbai (`bom1`) |
| Sydney | Sydney (`syd1`) |

Verify currently available Vercel regions in the dashboard before selecting one.

## 6. Supabase production URLs

After Vercel assigns the production domain:

- [ ] Set **Authentication → URL Configuration → Site URL** to `https://rag-chat-swart.vercel.app`.
- [ ] Add `http://localhost:3000/**` as an allowed development redirect.
- [ ] Add `https://rag-chat-swart.vercel.app/**` as an allowed production redirect.
- [ ] Send a new magic link and confirm `/auth/confirm` returns to the protected workspace.

## 7. Production smoke test

- [ ] An unauthenticated visit to `/` redirects to `/login`.
- [ ] Magic-link sign-in succeeds and the session survives a refresh.
- [ ] Sign-out returns to `/login`.
- [ ] A text-based PDF under 8 MB uploads successfully.
- [ ] A non-PDF and oversized PDF are rejected clearly.
- [ ] A document-grounded question streams an answer with clickable citations.
- [ ] A question absent from the document returns `I couldn't find that in your documents`.
- [ ] A selected-document filter excludes unselected files.
- [ ] Deleting a document removes its database rows and Storage object.
- [ ] Repeated chat and ingestion requests eventually produce friendly `429` responses.
- [ ] A second user cannot access the first user's documents.

## 8. Observability and portfolio launch

- [ ] Review Vercel Function logs for chat/ingestion errors and timeouts.
- [ ] Review Supabase Auth logs, database logs, and Storage usage.
- [ ] Review Upstash request volume and rate-limit activity.
- [x] Add `docs/screenshots/workspace.png`.
- [x] Add `docs/screenshots/grounded-answer.png`.
- [x] Add `docs/screenshots/document-chat-demo.gif`.
- [x] Replace the README live-demo placeholder.
- [ ] Add the live URL to the GitHub repository description.

## Rollback

If a production deployment fails, use Vercel's previous deployment promotion/rollback, then inspect Function logs before redeploying. Do not roll back the Supabase schema destructively; create a forward migration for database corrections.
