import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const model = 'llama-3.1-8b-instant'

function extractJsonBlock(text: string) {
	if (!text) return null
	const match = text.match(/\{[\s\S]*\}/)
	if (!match) return null
	try {
		return JSON.parse(match[0]) as Record<string, unknown>
	} catch (err) {
		console.error('name-suggest JSON parse failed', err)
		return null
	}
}

export async function POST(req: Request) {
	if (!process.env.GROQ_API_KEY) {
		return NextResponse.json({ error: 'GROQ_API_KEY is missing' }, { status: 500 })
	}
	const body = await req.json().catch(() => null)
	const email = typeof body?.email === 'string' ? body.email.trim() : ''

	if (!email || !email.includes('@')) {
		return NextResponse.json({ error: 'email is required' }, { status: 400 })
	}
	const messages = [
		{
			role: 'system',
			content:
				'You infer a likely human name from an email address. Respond ONLY with JSON: {"name":"Full Name"} or {"name":null} if unsure.',
		},
		{
			role: 'user',
			content: `Email: ${email}\nReturn JSON with a single key \'name\' (null if unknown).`,
		},
	]

	const payload = {
		model,
		messages,
		temperature: 0.2,
		max_tokens: 60,
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
	const name = typeof raw?.name === 'string' ? raw.name.trim() : null

	return NextResponse.json({ name })
}
