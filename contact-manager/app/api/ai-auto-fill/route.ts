import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type AutoFillResult = {
  name?: string | null
  company?: string | null
  role?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

const model = 'llama-3.1-8b-instant'

function extractJsonBlock(text: string) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch (err) {
    console.error('JSON parse failed', err)
    return null
  }
}

function sanitize(result: Record<string, unknown>): AutoFillResult {
  const pick = (key: string) => {
    const value = result?.[key]
    if (typeof value === 'string') return value.trim() || null
    return null
  }

  return {
    name: pick('name'),
    company: pick('company'),
    role: pick('role'),
    city: pick('city'),
    phone: pick('phone'),
    email: pick('email'),
    notes: pick('notes'),
  }
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY is missing' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  const input = typeof body?.input === 'string' ? body.input.trim() : ''

  if (!input) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 })
  }

  const messages = [
    {
      role: 'system',
      content:
        'You extract contact details. Respond ONLY with a JSON object. Fields: name, company, role, city, phone, email, notes. Use null for unknown values.',
    },
    {
      role: 'user',
      content: `Text: """${input}"""\nReturn JSON with the fields: name, company, role, city, phone, email, notes. JSON only, no prose.`,
    },
  ]

  const payload = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 300,
  }

  const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!apiRes.ok) {
    const detail = await apiRes.text().catch(() => '')
    return NextResponse.json({ error: 'Grok request failed', detail }, { status: 502 })
  }

  const data = await apiRes.json().catch(() => null)
  const content: string = data?.choices?.[0]?.message?.content ?? ''
  const raw = extractJsonBlock(content)

  if (!raw) {
    return NextResponse.json({ error: 'Unable to parse AI response', raw: content }, { status: 502 })
  }

  const cleaned = sanitize(raw)
  return NextResponse.json({ data: cleaned })
}