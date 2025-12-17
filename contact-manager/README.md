# Contact Manager

Simple Contact Manager built for the assignment.

Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + MongoDB (Atlas recommended)
- NextAuth (GitHub) — optional (placeholders provided)

Quick start
1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_URL`.
2. From project root run:

```bash
npm install
npm run prisma:generate
npm run dev
```

3. Open `http://localhost:3000`.

Notes
- Update the GitHub OAuth app callback URL after deployment.
- If you don't want auth now, you can leave provider env vars empty.
