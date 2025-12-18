Deployment checklist (Vercel)

Before you push and deploy, run these local checks and ensure env vars are set in Vercel.

1) Install dependencies

```powershell
npm ci
# or
npm install
```

2) Generate Prisma client (explicit)

```powershell
npx prisma generate
```

3) (Optional) Push Prisma schema to your MongoDB Atlas if you changed schema

```powershell
npx prisma db push
```

4) Type-check (optional but recommended)

```powershell
npx tsc --noEmit
```

5) Build and smoke-start locally (this project includes a `smoke` script)

```powershell
npm run smoke
# The command runs build then starts the production server on the default port (3000).
# In another shell, run the health & DB checks below.
```

6) Local health & DB checks

```powershell
Invoke-RestMethod 'http://localhost:3000/api/debug' | ConvertTo-Json -Depth 5
Invoke-RestMethod 'http://localhost:3000/api/db-inspect' | ConvertTo-Json -Depth 5
Invoke-RestMethod 'http://localhost:3000/api/contacts' | ConvertTo-Json -Depth 5
Invoke-RestMethod 'http://localhost:3000/api/contacts?showDeleted=only' | ConvertTo-Json -Depth 5
```

Also open these pages in your browser:
- http://localhost:3000/
- http://localhost:3000/contacts
- http://localhost:3000/contacts/trash

7) Vercel environment variables (set these in Project Settings → Environment Variables)
- `DATABASE_URL` — MongoDB Atlas connection string (mongodb+srv://...)
- `GROQ_API_KEY` — your Grok/OpenAI API key
- If using NextAuth (GitHub): `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`

8) Vercel build settings
- Vercel runs `npm run build` by default. This project runs `prisma generate` during build.
- Node version: package.json contains `engines.node = 18.x`. You can set Node 18 in Vercel to match.

9) Do NOT commit `.env` or secrets to the repo.

10) Deploy with Vercel CLI (optional):
```powershell
npm i -g vercel
vercel login
vercel --prod
```

Troubleshooting
- If Prisma cannot connect on Vercel, double-check `DATABASE_URL` and network access (Atlas IP access list / VPC).
- If `/api/db-inspect` or `/api/debug` behaves unexpectedly after deploy, paste the JSON here and I can help diagnose.

That's it — run the checks above locally, then push and deploy when you're ready.