# CodePro

A full-stack competitive-programming platform where developers practice coding problems, run and submit solutions in multiple languages, compete in contests, and learn through curated guides and community discussions.

Live app: **[codepro-ivory.vercel.app](https://codepro-ivory.vercel.app)**

---

## Features

- **Problem workspace** — browse problems by topic/difficulty, read statements with rich Markdown + LaTeX, and solve them in an in-browser **Monaco** editor.
- **Multi-language code execution** — run and submit solutions in **C++, Java, JavaScript, and Python**, judged against test cases on a self-hosted **Judge0** engine with an automatic **Piston** fallback.
- **Editorials & solutions** — official approaches with complexity analysis, plus a community solutions feed.
- **Contests** — timed competitions with per-problem submission and scoring.
- **Explore** — structured learning through guides, topics, and study paths, with full-text search.
- **Discussions** — a community forum to ask questions and share ideas.
- **Profiles & gamification** — points, avatar customization, a shop, orders, and saved notes.
- **AI assistant** — an in-app chatbot powered by **Google Gemini**.
- **Realtime chat** — direct messaging with friends and unread tracking.
- **Content pages** — blog, careers, FAQ, about, and contact.

## Tech Stack

| Area | Technology |
|------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Base UI, Framer Motion |
| Editor | Monaco Editor |
| Backend / Data | Firebase Authentication & Cloud Firestore |
| Code execution | Self-hosted Judge0 CE (+ Piston fallback) |
| AI | Google Gemini (`@google/generative-ai`) |
| Content | react-markdown, remark-gfm, KaTeX (remark-math / rehype-katex) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18.18+ (or 20+)
- A Firebase project (Authentication + Firestore)
- A Google Gemini API key
- Access to a Judge0 instance (self-hosted or a provider)

### Installation

```bash
git clone https://github.com/Daniel-Engineer-dev/programing-application.git
cd programing-application
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
# Firebase (client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI assistant
GEMINI_API_KEY=

# Code execution (Judge0)
JUDGE0_API_URL=
JUDGE0_AUTH_TOKEN=
```

> `.env` and any credential files are git-ignored — never commit secrets.

### Run

```bash
npm run dev      # start the dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
```

## Code Execution Architecture

User code is never executed on the Next.js server. The API route at
[`src/app/(user)/piston/route.ts`](src/app/(user)/piston/route.ts):

1. Loads the problem's **driver code** and **test cases** from Firestore.
2. Wraps the user's solution into the language-specific driver (I/O harness).
3. Submits a batch to **Judge0** (`JUDGE0_API_URL`, authenticated with `JUDGE0_AUTH_TOKEN`).
4. Falls back to the public **Piston** API if Judge0 is unavailable, so runs degrade gracefully.

Each problem stores `defaultCode`, `driverCodes`, and a `testCases` sub-collection per language.

## Project Structure

```
src/
├── app/            # App Router routes (problems, contests, explore, discuss, blog, auth, API routes)
├── components/     # UI + feature components (EditorPanel, ProblemDetail, Admin, …)
├── hooks/          # Reusable React hooks
└── lib/            # Firebase client and shared utilities
```

## Deployment

The app deploys to **Vercel**. Configure the same environment variables in the Vercel
project settings, then push to `main` to trigger a production deployment.

## License

Private project — all rights reserved.
