<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366F1,50:8B5CF6,100:06B6D4&height=220&section=header&text=Context&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Chat%20with%20your%20PDFs.%20Every%20answer%20cited%20to%20the%20page.&descSize=20&descAlignY=60&animation=fadeIn" alt="Context banner" width="100%" />

<a href="https://rag-chat-swart.vercel.app">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&duration=3200&pause=900&color=8B5CF6&center=true&vCenter=true&width=720&lines=Production-grade+RAG+for+private+PDFs;Page-aware+retrieval+with+pgvector;Streamed+answers+from+Gemini;Inline+citations.+Exact+refusals.+Zero+guesswork." alt="Typing animation" />
</a>

<br/>

[![Live Demo](https://img.shields.io/badge/%E2%9C%A8_LIVE_DEMO-rag--chat--swart.vercel.app-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://rag-chat-swart.vercel.app)
[![Status](https://img.shields.io/badge/STATUS-PRODUCTION_READY-10B981?style=for-the-badge)](https://rag-chat-swart.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Postgres](https://img.shields.io/badge/pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=upstash&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

<br/>

**[Live App](https://rag-chat-swart.vercel.app)** &nbsp;•&nbsp; **[Evaluation](#-evaluation-results)** &nbsp;•&nbsp; **[Architecture](#-architecture)** &nbsp;•&nbsp; **[Quick Start](#-quick-start)** &nbsp;•&nbsp; **[Deployment](#-deployment)**

</div>

<br/>

---

## 🎬 Demo

<div align="center">

![Context demo: sign in, upload a PDF, ask a question, inspect citations, and delete the document](docs/screenshots/document-chat-demo.gif)

<sub>Sign in → upload a PDF → ask a question → inspect the evidence → delete the document</sub>

</div>

<br/>

<table>
  <tr>
    <td align="center" width="50%">
      <b>🗂️ Workspace</b><br/><br/>
      <img src="docs/screenshots/workspace.png" alt="Authenticated workspace with an ingested sample report" />
    </td>
    <td align="center" width="50%">
      <b>📎 Grounded answer + citations</b><br/><br/>
      <img src="docs/screenshots/grounded-answer.png" alt="Grounded answer with inline citations and page-aware source cards" />
    </td>
  </tr>
</table>

---

## 💡 What is Context?

**Context** is a production-oriented Retrieval-Augmented Generation (RAG) app for asking questions about **private PDF documents**. It extracts and embeds page-aware chunks, retrieves relevant evidence with **pgvector**, streams answers from **Gemini**, and links every supported claim back to its **source page**.

> 🧪 **Try it:** upload a text-based PDF, ask a document-specific question, and inspect the page-level evidence behind the answer.

---

## ✨ Highlights

<table>
  <tr>
    <td width="50%" valign="top">

**🎨 Experience**
- Responsive AI workspace with dark/light themes
- Accessible motion and polished interaction states
- Inline numbered citations linked to file, page, and snippet cards
- Selectable document scope

**🔐 Security**
- Passwordless Supabase auth with protected routes
- Cookie-based SSR sessions
- Row-level security on every table
- Retrieved text treated as untrusted data

  </td>
  <td width="50%" valign="top">

**🧠 Retrieval**
- Page-aware chunking (~600 tokens, 80 overlap)
- Gemini embeddings + pgvector HNSW search
- Query rewriting for follow-up questions
- Similarity gating with an exact refusal fallback

**⚙️ Engineering**
- PDFs processed in memory, never written to disk
- Per-user Upstash sliding-window rate limits
- Reproducible 20-question evaluation suite
- Deployed on Vercel from `main`

  </td>
  </tr>
</table>

---

## 📊 Evaluation Results

The checked-in evaluation uses a generated six-page community-solar report and runs the **real** ingestion, embedding, retrieval, and answering pipeline: 20 questions, including 4 unanswerable cases.

<div align="center">

| 🎯 Top-1 Retrieval | ✅ Answer Correctness | 🛑 Refusal Accuracy | ⚡ Avg Latency | 💥 Failures |
| :---: | :---: | :---: | :---: | :---: |
| **93.8%** | **100%** | **100%** | **3,005 ms** | **0** |
| 15 / 16 | 16 / 16 | 4 / 4 | end-to-end | provider/runtime |

</div>

Per-question answers, source pages, similarities, and latency are in [`eval/results.md`](eval/results.md).

---

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph Ingestion[PDF ingestion]
    U1[Authenticated user] -->|PDF up to 8 MB| I[/api/ingest]
    I --> V[Zod and PDF signature validation]
    V --> P[In-memory page extraction]
    P --> C[Page-aware chunking]
    C --> E[Gemini document embeddings]
    E --> DB[(Supabase pgvector)]
    V --> S[(Private Supabase Storage)]
  end

  subgraph Query[Grounded question answering]
    U2[Authenticated user] -->|Question and selected documents| Q[/api/chat]
    Q --> R[Standalone query rewrite]
    R --> QE[Gemini query embedding]
    QE --> M[match_chunks RPC with RLS]
    DB --> M
    M --> T{Similarity at least 0.54?}
    T -->|No| F[Exact refusal]
    T -->|Yes| G[Numbered untrusted context]
    G --> L[Gemini streamed answer]
    L --> UI[Inline citations and source cards]
  end

  AUTH[Supabase Auth] --> I
  AUTH --> Q
  RL[Upstash Redis] --> I
  RL --> Q
```

---

## 🧰 Tech Stack

| Layer | Technology |
| :--- | :--- |
| 🖥️ **Web app** | Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS 4 |
| 🎨 **Interface** | Source-owned responsive components · Lucide icons · CSS motion with reduced-motion support |
| 🤖 **AI orchestration** | Vercel AI SDK 7 · Google Gemini provider |
| 🗄️ **Data** | Supabase Postgres · pgvector · HNSW cosine index |
| 🔑 **Files & identity** | Supabase Storage · passwordless Auth |
| 🛡️ **Abuse prevention** | Upstash Redis · `@upstash/ratelimit` |
| ✅ **Validation & parsing** | Zod · `unpdf` |
| 🧪 **Evaluation** | TypeScript · `pdf-lib` · keyword scoring · retrieval/page assertions |

---

## 🔬 Retrieval Decisions

<details open>
<summary><b>Why these numbers?</b></summary>

<br/>

| Decision | Reasoning |
| :--- | :--- |
| **Page-aware chunks** | Each chunk keeps its PDF page so citations stay auditable. |
| **600-token target, 80-token overlap** | Coherent passages while reducing boundary loss. |
| **768-dimensional embeddings** | Explicitly configured to match the pgvector column and Gemini embedding output. |
| **HNSW cosine search** | Low-latency approximate nearest-neighbor retrieval with no training step. |
| **Top 6 chunks** | Enough evidence for synthesis while limiting prompt size. |
| **0.54 similarity threshold** | Chosen from evaluation. The earlier `0.62` threshold rejected two answerable questions. |
| **Defense in depth** | RLS scopes database results, selected document IDs narrow retrieval, and server prompts treat document content as untrusted data rather than instructions. |

All model names, embedding dimensions, chunk sizes, retrieval count, and threshold live in [`lib/config.ts`](lib/config.ts).

</details>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22 or newer
- Google Generative AI API key
- Supabase project
- Upstash Redis database

### 1 · Install

```bash
git clone https://github.com/MirajHossain22/RAG-chat.git
cd RAG-chat
npm install
```

<details>
<summary><b>2 · Configure environment variables</b></summary>

<br/>

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS / Linux:

```bash
cp .env.example .env.local
```

Fill `.env.local`:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_CHAT_MODEL=gemini-3.1-flash-lite
GOOGLE_EMBEDDING_MODEL=gemini-embedding-001

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

> ⚠️ Never expose the Google, service-role, or Upstash secrets through `NEXT_PUBLIC_` variables. `.env.local` is ignored by Git.

</details>

<details>
<summary><b>3 · Configure Supabase</b></summary>

<br/>

1. Open **SQL Editor**, paste [`supabase/migrations/20261029000100_initial_rag_schema.sql`](supabase/migrations/20261029000100_initial_rag_schema.sql), and run it.
2. Under **Authentication → URL Configuration**, use `http://localhost:3000` as the local Site URL.
3. Configure custom SMTP for production email delivery.
4. Under **Authentication → Emails → Magic link or OTP → Source**, use:

```html
<h2>Sign in to Context</h2>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Sign in
  </a>
</p>
```

The first successful PDF ingestion creates the private `documents` Storage bucket if it does not exist.

</details>

### 4 · Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in by email, upload a text-based PDF, and ask a document-specific question.

---

## 🧪 Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run build` | Production build and TypeScript validation |
| `npm run start` | Serve the production build |
| `npm run eval` | Full 20-question evaluation |
| `npm run eval -- --limit=2` | Low-cost evaluation smoke test |

The evaluator creates an isolated temporary Supabase user and document, saves `eval/results.md`, and deletes the remote test data in a `finally` cleanup block.

---

## ☁️ Deployment

Deployed from the connected GitHub `main` branch at **[rag-chat-swart.vercel.app](https://rag-chat-swart.vercel.app)**. For a new deployment or fork:

1. Import `MirajHossain22/RAG-chat` into Vercel.
2. Add every variable from `.env.example` to the Production environment.
3. Enable Fluid Compute and select a Function Region close to the Supabase project region.
4. Keep the route-level limits already defined in code: 120 seconds for chat and 300 seconds for ingestion.
5. Deploy, then set the Supabase Site URL and allowed redirect URL to the production Vercel domain.
6. Verify authentication, upload, grounded answers, citations, refusal behavior, deletion, and rate limits.

Use the detailed [Vercel deployment checklist](docs/DEPLOYMENT.md) before publishing the portfolio link.

---

## 🛡️ Security & Hardening

- 📄 Uploads restricted to PDFs ≤ 8 MB, validated by MIME type, extension, and file signature
- 🧠 PDFs processed in memory because Vercel functions have no persistent filesystem
- 🔐 Authenticated requests verified server-side; protected pages use verified Supabase claims
- 🧱 RLS prevents users from reading or modifying other users' documents and chunks
- 🗝️ Private Storage path namespaced by user ID
- 🚫 Retrieved document text treated as untrusted data to mitigate prompt injection
- ⏱️ Separate per-user sliding-window limits for chat and ingestion
- 🏭 Production refuses expensive requests when Upstash is not configured
- 🤫 Secrets stay server-side; `.env.local` is excluded from version control

---

## 🗂️ Project Structure

```text
app/api/              Authenticated ingestion, document, and chat routes
components/           Workspace, sidebar, citations, login, and toast UI
eval/                 Sample PDF generator, 20 Q&A cases, runner, and results
hooks/                Authenticated document-library state
lib/                  Chunking, embeddings, retrieval, prompts, config, Supabase
supabase/migrations/  pgvector schema, RPC, constraints, and RLS policies
proxy.ts              Next.js 16 Supabase session refresh and route protection
```

---

## ⚠️ Known Limitations

<details>
<summary><b>Click to expand</b></summary>

<br/>

- Image-only/scanned PDFs require OCR and currently return a clear extraction error.
- The 8 MB and 250-page limits prioritize predictable serverless execution.
- The answer model receives the top six chunks, so document-wide summaries may omit low-ranked sections in very large PDFs.
- Citations identify the PDF page but do not yet highlight exact coordinates inside the rendered PDF.
- Email delivery depends on the configured SMTP provider.
- Evaluation uses a synthetic six-page report; a broader domain-specific benchmark would provide stronger external validity.
- Conversation history is held in the current browser session rather than persisted as named conversations.

</details>

## 🗺️ Roadmap

- [ ] OCR for scanned documents
- [ ] Hybrid BM25 + vector retrieval with reranking
- [ ] Persistent conversation history and shareable research sessions
- [ ] PDF viewer with citation-region highlighting
- [ ] Background ingestion jobs for larger files
- [ ] Multi-format ingestion (DOCX, HTML, Markdown)
- [ ] Larger human-reviewed evaluation sets and semantic answer judging
- [ ] Observability dashboards for latency, refusal rate, and retrieval quality

---

## 👤 Author

<div align="center">

**Designed and built by Miraj Hossain**

[![GitHub](https://img.shields.io/badge/GitHub-@MirajHossain22-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MirajHossain22)
[![Email](https://img.shields.io/badge/Email-mirajh417@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mirajh417@gmail.com)
[![Live Project](https://img.shields.io/badge/Live-rag--chat--swart.vercel.app-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://rag-chat-swart.vercel.app)

<br/>

⭐ **If you found this useful, consider starring the repo.** ⭐

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:06B6D4,50:8B5CF6,100:6366F1&height=120&section=footer" alt="footer" width="100%" />

</div>
