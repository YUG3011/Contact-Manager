import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

function parseQuery(q: string) {
  const txt = (q || '').toString().trim()
  const lower = txt.toLowerCase()
  const filters: any = { keywords: [] }

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startOfDay = (d: Date) => {
    const nd = new Date(d)
    nd.setHours(0, 0, 0, 0)
    return nd
  }
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
  const hoursAgo = (n: number) => { const d = new Date(); d.setHours(d.getHours() - n); return d }
  const minutesAgo = (n: number) => { const d = new Date(); d.setMinutes(d.getMinutes() - n); return d }
  const secondsAgo = (n: number) => { const d = new Date(); d.setSeconds(d.getSeconds() - n); return d }
  const weeksAgo = (n: number) => daysAgo(n * 7)
  const monthsAgo = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d }
  const yearsAgo = (n: number) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return d }

  // Decide whether time filter applies to updatedAt or createdAt
  // Default is updatedAt unless query clearly says created/added.
  const wantsCreated = /\b(created|added|new|recently\s+added|recently\s+created|recently\s+added\s+contacts|recently\s+created\s+contacts|recently\s+added\b)\b/.test(lower)
  const wantsUpdated = /\b(updated|edited|modified)\b/.test(lower)
  const timeField: 'createdAt' | 'updatedAt' = wantsCreated && !wantsUpdated ? 'createdAt' : 'updatedAt'

  const setAfter = (d: Date) => {
    if (timeField === 'createdAt') filters.createdAfter = d
    else filters.updatedAfter = d
  }

  // Time phrases
  let m: RegExpMatchArray | null = null

  // today / yesterday
  if (/\btoday\b/.test(lower)) setAfter(startOfDay(new Date()))
  if (/\byesterday\b/.test(lower)) setAfter(startOfDay(daysAgo(1)))

  // last week / last month (common human phrasing)
  if (/\blast\s+week\b/.test(lower)) setAfter(weeksAgo(1))
  if (/\blast\s+month\b/.test(lower)) setAfter(monthsAgo(1))

  // in last N days/weeks/months OR last N days/weeks/months
  m = lower.match(/(?:in\s+)?last\s+(\d+)\s+(seconds?|secs?|sec|s|minutes?|mins?|minuts?|m|hours?|hrs?|hr|h|days?|weeks?|months?|years?|yrs?|yr)\b/)
  if (m && m[1] && m[2]) {
    const n = Number(m[1])
    if (!Number.isNaN(n)) {
      if (/sec/.test(m[2]) || /^s$/.test(m[2])) setAfter(secondsAgo(n))
      else if (/min/.test(m[2]) || /^m$/.test(m[2])) setAfter(minutesAgo(n))
      else if (/hour|hr|h/.test(m[2])) setAfter(hoursAgo(n))
      else if (/week/.test(m[2])) setAfter(weeksAgo(n))
      else if (/month/.test(m[2])) setAfter(monthsAgo(n))
      else if (/year|yr/.test(m[2])) setAfter(yearsAgo(n))
      else setAfter(daysAgo(n))
    }
  }

  // last hour/minute/second/year (singular or plural without number)
  if (/\blast\s+seconds?\b/.test(lower)) setAfter(secondsAgo(1))
  if (/\blast\s+minutes?\b|\blast\s+minuts?\b/.test(lower)) setAfter(minutesAgo(1))
  if (/\blast\s+hours?\b/.test(lower)) setAfter(hoursAgo(1))
  if (/\blast\s+year\b/.test(lower)) setAfter(yearsAgo(1))

  // recently (without explicit number) => last 7 days
  if (/\brecent(ly)?\b/.test(lower) && !filters.updatedAfter && !filters.createdAfter) {
    setAfter(daysAgo(7))
  }

  // missing fields
  if (/\bmissing\s+email\b|\bwithout\s+email\b|\bno\s+email\b/.test(lower)) filters.missing = (filters.missing || []).concat('email')
  if (/\bmissing\s+phone\b|\bwithout\s+phone\b|\bno\s+phone\b|\bwithout\s+phone\s+number\b|\bno\s+phone\s+number\b/.test(lower)) filters.missing = (filters.missing || []).concat('phone')

  // present fields ("with ...")
  if (/\bwith\s+phone\b|\bwith\s+phone\s+number\b/.test(lower)) filters.present = (filters.present || []).concat('phone')
  if (/\bwith\s+email\b/.test(lower)) filters.present = (filters.present || []).concat('email')
  if (/\bwith\s+city\b/.test(lower)) filters.present = (filters.present || []).concat('city')
  if (/\bwith\s+company\b/.test(lower)) filters.present = (filters.present || []).concat('company')
  if (/\bwith\s+role\b/.test(lower)) filters.present = (filters.present || []).concat('role')

  // Extract quoted phrases first ("Acme Corporation")
  const quoted = Array.from(txt.matchAll(/"([^"]+)"/g)).map((x) => x[1]).filter(Boolean)

  // City extraction: "in <city>" and "from <city>" (fixes: contacts from Mumbai)
  // If the query explicitly mentions "company" near the token, treat it as company.
  let city: string | undefined
  let company: string | undefined
  let role: string | undefined

  const fromMatch = lower.match(/\bfrom\s+([^,]+?)(?:\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)
  const atMatch = lower.match(/\b(?:working\s+at|works\s+at|at)\s+([^,]+?)(?:\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)
  const inMatch = lower.match(/\bin\s+([^,]+?)(?:\s+with\b|\s+without\b|\s+no\b|\s+missing\b|\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)

  const candidateFrom = fromMatch?.[1]?.trim()
  const candidateAt = atMatch?.[1]?.trim()
  const candidateIn = inMatch?.[1]?.trim()

  // Handle explicit "working at <company> in <role> in <city>" shape
  const workingFullMatch = txt.match(/\bworking\s+at\s+([^,]+?)\s+in\s+([^,]+?)\s+in\s+([^,]+?)(?:$|\s|,)/i)
  if (workingFullMatch) {
    const [, compRaw, roleRaw, cityRaw] = workingFullMatch
    if (!company) company = compRaw.trim()
    if (!role) role = roleRaw.trim()
    if (!city) city = cityRaw.trim()
  }

  const looksTimePhrase = (text: string) => /\b(last|today|yesterday)\b/.test(text) || /\d/.test(text)

  // Prefer explicit city via "in <city>" unless it looks like a company phrase or a time window (e.g. "in last 7 days")
  if (candidateIn && !/\bcompany\b/.test(candidateIn) && !looksTimePhrase(candidateIn)) city = candidateIn

  // Handle "from <...>": could be city or company
  if (candidateFrom) {
    const stripped = candidateFrom.replace(/"/g, '').trim()
    const looksCompany = /\b(company|inc\.?|corp\.?|ltd\.?|llc\b|co\b)/.test(stripped) || quoted.length > 0
    const cityWords = ['mumbai', 'delhi', 'bangalore', 'surat', 'rajkot', 'ahmedabad', 'dubai', 'pune', 'chennai', 'kolkata', 'hyderabad']
    const fromLower = stripped.toLowerCase()
    if (cityWords.includes(fromLower) && !looksTimePhrase(stripped)) {
      if (!city) city = stripped
      else company = stripped
    } else {
      const cleanedCompany = stripped.replace(/\b(company|inc\.?|corp\.?|ltd\.?|llc|co)\b/gi, '').trim()
      company = cleanedCompany || stripped
    }
  }

  // Handle "at/working at <company>" as company
  if (candidateAt) company = candidateAt

  // If user included a quoted phrase and we have no company yet, assume it's company
  if (!company && quoted.length) company = quoted[0]

  // Cleanup obvious non-company tails
  if (company) company = company.replace(/"/g, '').replace(/\b(company|contacts|people)\b/g, ' ').replace(/\s+/g, ' ').trim()
  if (city) city = city.replace(/"/g, '').replace(/\b(city|contacts|people)\b/g, ' ').replace(/\s+/g, ' ').trim()

  if (company) filters.company = company
  if (city) filters.city = city

  // Role extraction
  const roleMatch = lower.match(/\brole\s+([^,]+?)(?:\s+at\b|\s+in\b|\s+from\b|$)/)
  if (roleMatch) role = roleMatch[1].trim()
  const workingAsMatch = lower.match(/\bworking\s+as\s+([^,]+?)(?:\s+at\b|\s+in\b|\s+from\b|$)/)
  if (!role && workingAsMatch) role = workingAsMatch[1].trim()
  if (role) {
    role = role.replace(/\b(role|people|contacts)\b/g, ' ').replace(/\s+/g, ' ').trim()
    if (role) filters.role = role
  }

  // Extract remaining keywords
  let cleaned = txt
  if (filters.company) cleaned = cleaned.replace(new RegExp(escapeRegex(filters.company), 'i'), ' ')
  if (filters.city) cleaned = cleaned.replace(new RegExp(escapeRegex(filters.city), 'i'), ' ')
  if (filters.role) cleaned = cleaned.replace(new RegExp(escapeRegex(filters.role), 'i'), ' ')
  quoted.forEach((qp) => {
    cleaned = cleaned.replace(new RegExp('"' + escapeRegex(qp) + '"', 'g'), ' ')
  })

  cleaned = cleaned.replace(/\b(updated|edited|modified|added|created|new|recent|recently|last|in|days?|weeks?|months?|month|week|hours?|minutes?|minuts?|seconds?|years?|yesterday|today|missing|without|with|no|from|at|working|works|company|contacts|people|i|role|email|phone|city|company|number)\b/gmi, ' ')
  cleaned = cleaned.replace(/\b\d+\b/g, ' ')
  cleaned = cleaned.replace(/["']/g, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  if (cleaned) filters.keywords = cleaned.split(' ').filter((t) => Boolean(t) && t !== '"' && t !== "'")

  return filters
}

function toDate(v: any) {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'object' && ('$date' in v)) {
    const d = new Date((v as any).$date)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const q = body.q || ''
    const city = body.city || undefined
    const company = body.company || undefined
    const role = body.role || undefined
    const sort = body.sort || 'createdAt'
    const allowedSort = ['name', 'lastUsed', 'priority', 'createdAt', 'updatedAt'] as const
    const sortField = allowedSort.includes(sort as any) ? sort : 'createdAt'
    const showDeleted = body.showDeleted || undefined

    const parsed = parseQuery(q)
    if (process.env.DEBUG_SEARCH) console.log('search parsed', q, parsed)

    let docs: any[] = []

    const buildRoleFilter = (val?: string) => {
      if (!val) return null
      const variants = new Set<string>()
      const cleaned = val.trim()
      if (!cleaned) return null
      variants.add(cleaned)
      variants.add(cleaned.replace(/[-_]+/g, ' '))
      variants.add(cleaned.replace(/fullstack/gi, 'full stack').replace(/frontend/gi, 'front end').replace(/backend/gi, 'back end'))

      const ors: any[] = []
      for (const v of variants) {
        if (!v) continue
        ors.push({ role: { contains: v, mode: 'insensitive' } })
        const tokens = v.split(/[\s-]+/).filter(Boolean)
        if (tokens.length > 1) {
          ors.push({ AND: tokens.map((t) => ({ role: { contains: t, mode: 'insensitive' } })) })
        }
      }
      return ors.length ? { OR: ors } : null
    }

    // Use Prisma only (more predictable filtering across environments)
    try {
      const where: any = {}
      const ands: any[] = []

      if (parsed.company || company) where.company = { contains: parsed.company || company, mode: 'insensitive' }
      const roleFilter = buildRoleFilter(parsed.role || role)
      if (roleFilter) ands.push(roleFilter)
      if (parsed.city || city) where.city = { contains: parsed.city || city, mode: 'insensitive' }

      if (parsed.updatedAfter) where.updatedAt = { gte: parsed.updatedAfter as Date }
      if (parsed.createdAfter) where.createdAt = { gte: parsed.createdAfter as Date }

      if (parsed.present && parsed.present.includes('email')) ands.push({ NOT: { email: { equals: '' } } })
      if (parsed.present && parsed.present.includes('phone')) ands.push({ AND: [{ phone: { not: null } }, { NOT: { phone: { equals: '' } } }] })
      if (parsed.present && parsed.present.includes('city')) ands.push({ AND: [{ city: { not: null } }, { NOT: { city: { equals: '' } } }] })
      if (parsed.present && parsed.present.includes('company')) ands.push({ AND: [{ company: { not: null } }, { NOT: { company: { equals: '' } } }] })
      if (parsed.present && parsed.present.includes('role')) ands.push({ AND: [{ role: { not: null } }, { NOT: { role: { equals: '' } } }] })

      if (parsed.missing && parsed.missing.includes('email')) ands.push({ email: { equals: '' } })
      if (parsed.missing && parsed.missing.includes('phone')) ands.push({ OR: [{ phone: { equals: null } }, { phone: { equals: '' } }] })

      if (parsed.keywords && parsed.keywords.length) {
        const kw = parsed.keywords.join(' ')
        ands.push({ OR: [
          { name: { contains: kw, mode: 'insensitive' } },
          { email: { contains: kw, mode: 'insensitive' } },
          { company: { contains: kw, mode: 'insensitive' } },
          { role: { contains: kw, mode: 'insensitive' } },
          { city: { contains: kw, mode: 'insensitive' } },
          { notes: { contains: kw, mode: 'insensitive' } },
        ] })
      }

      if (ands.length) where.AND = ands
      docs = await prisma.contact.findMany({ where, orderBy: { [sortField]: 'desc' } })
    } catch (inner) {
      console.error('POST /api/search Prisma failed:', inner)
      const msg = inner instanceof Error ? inner.message : 'search error'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const toDateLocal = (v: any) => toDate(v) ?? new Date(0)

    let contacts = docs.map((doc: any) => {
      const id = doc?.id ?? doc?._id?.$oid ?? doc?._id?.toString?.() ?? String(doc?._id ?? '')
      const createdAt = toDateLocal(doc.createdAt)
      const updatedAt = toDate(doc.updatedAt) ?? createdAt
      const deletedAt = toDate(doc.deletedAt)
      const expiresAt = toDate(doc.expiresAt)
      return { ...doc, id, _id: undefined, createdAt, updatedAt, deletedAt, expiresAt }
    })

    if (showDeleted === 'only') contacts = contacts.filter((c: any) => c.deletedAt != null)
    else if (showDeleted === '1') {
      // include both
    } else {
      contacts = contacts.filter((c: any) => c.deletedAt == null)
    }

    // If a role filter produced zero results, retry without the role constraint
    if (contacts.length === 0 && (parsed.role || role)) {
      try {
        const where: any = {}
        const ands: any[] = []

        if (parsed.company || company) where.company = { contains: parsed.company || company, mode: 'insensitive' }
        if (parsed.city || city) where.city = { contains: parsed.city || city, mode: 'insensitive' }

        if (parsed.updatedAfter) where.updatedAt = { gte: parsed.updatedAfter as Date }
        if (parsed.createdAfter) where.createdAt = { gte: parsed.createdAfter as Date }

        if (parsed.present && parsed.present.includes('email')) ands.push({ NOT: { email: { equals: '' } } })
        if (parsed.present && parsed.present.includes('phone')) ands.push({ AND: [{ phone: { not: null } }, { NOT: { phone: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('city')) ands.push({ AND: [{ city: { not: null } }, { NOT: { city: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('company')) ands.push({ AND: [{ company: { not: null } }, { NOT: { company: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('role')) ands.push({ AND: [{ role: { not: null } }, { NOT: { role: { equals: '' } } }] })

        if (parsed.missing && parsed.missing.includes('email')) ands.push({ email: { equals: '' } })
        if (parsed.missing && parsed.missing.includes('phone')) ands.push({ OR: [{ phone: { equals: null } }, { phone: { equals: '' } }] })

        if (parsed.keywords && parsed.keywords.length) {
          const kw = parsed.keywords.join(' ')
          ands.push({ OR: [
            { name: { contains: kw, mode: 'insensitive' } },
            { email: { contains: kw, mode: 'insensitive' } },
            { company: { contains: kw, mode: 'insensitive' } },
            { role: { contains: kw, mode: 'insensitive' } },
            { city: { contains: kw, mode: 'insensitive' } },
            { notes: { contains: kw, mode: 'insensitive' } },
          ] })
        }

        if (ands.length) where.AND = ands
        const relaxedRoleDocs = await prisma.contact.findMany({ where, orderBy: { [sortField]: 'desc' } })
        const relaxedContacts = relaxedRoleDocs.map((doc: any) => {
          const id = doc?.id ?? doc?._id?.$oid ?? doc?._id?.toString?.() ?? String(doc?._id ?? '')
          const createdAt = toDateLocal(doc.createdAt)
          const updatedAt = toDate(doc.updatedAt) ?? createdAt
          const deletedAt = toDate(doc.deletedAt)
          const expiresAt = toDate(doc.expiresAt)
          return { ...doc, id, _id: undefined, createdAt, updatedAt, deletedAt, expiresAt, _broadened: true }
        })

        if (showDeleted === 'only') contacts = relaxedContacts.filter((c: any) => c.deletedAt != null)
        else if (showDeleted === '1') contacts = relaxedContacts
        else contacts = relaxedContacts.filter((c: any) => c.deletedAt == null)
      } catch (roleRelaxErr) {
        console.error('role relax failed', roleRelaxErr)
      }
    }

    // If a strict date filter returned no results, attempt a safe broaden:
    // re-run the query without the date constraints and return those results
    // marked with `_broadened: true` so the UI can indicate a relaxed match.
    if ((contacts.length === 0) && (parsed.updatedAfter || parsed.createdAfter)) {
      try {
        // retry without date constraints but keep other structural filters
        const where: any = {}
        const ands: any[] = []

        if (parsed.company || company) ands.push({ company: { contains: parsed.company || company, mode: 'insensitive' } })
        const relaxedRoleFilter = buildRoleFilter(parsed.role || role)
        if (relaxedRoleFilter) ands.push(relaxedRoleFilter)
        if (parsed.city || city) ands.push({ city: { contains: parsed.city || city, mode: 'insensitive' } })

        if (parsed.present && parsed.present.includes('email')) ands.push({ NOT: { email: { equals: '' } } })
        if (parsed.present && parsed.present.includes('phone')) ands.push({ AND: [{ phone: { not: null } }, { NOT: { phone: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('city')) ands.push({ AND: [{ city: { not: null } }, { NOT: { city: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('company')) ands.push({ AND: [{ company: { not: null } }, { NOT: { company: { equals: '' } } }] })
        if (parsed.present && parsed.present.includes('role')) ands.push({ AND: [{ role: { not: null } }, { NOT: { role: { equals: '' } } }] })

        if (parsed.missing && parsed.missing.includes('email')) ands.push({ email: { equals: '' } })
        if (parsed.missing && parsed.missing.includes('phone')) ands.push({ OR: [{ phone: { equals: null } }, { phone: { equals: '' } }] })

        if (parsed.keywords && parsed.keywords.length) {
          const qwords = parsed.keywords.join(' ')
          ands.push({ OR: [ { name: { contains: qwords, mode: 'insensitive' } }, { email: { contains: qwords, mode: 'insensitive' } }, { company: { contains: qwords, mode: 'insensitive' } }, { role: { contains: qwords, mode: 'insensitive' } }, { city: { contains: qwords, mode: 'insensitive' } }, { notes: { contains: qwords, mode: 'insensitive' } } ] })
        }

        if (ands.length) where.AND = ands

        let relaxedDocs: any[] = []
        try {
          relaxedDocs = await prisma.contact.findMany({ where, orderBy: { [sortField]: 'desc' } })
        } catch (innerPrisma) {
          console.error('relaxed Prisma fallback failed', innerPrisma)
        }

        const relaxed = relaxedDocs.map((doc: any) => {
          const id = doc?.id ?? doc?._id?.$oid ?? doc?._id?.toString?.() ?? String(doc?._id ?? '')
          const createdAt = toDateLocal(doc.createdAt)
          const updatedAt = toDate(doc.updatedAt) ?? createdAt
          const deletedAt = toDate(doc.deletedAt)
          const expiresAt = toDate(doc.expiresAt)
          return { ...doc, id, _id: undefined, createdAt, updatedAt, deletedAt, expiresAt, _broadened: true }
        })

        // Apply showDeleted filtering to relaxed results as well
        let finalRelaxed = relaxed
        if (showDeleted === 'only') finalRelaxed = relaxed.filter((c: any) => c.deletedAt != null)
        else if (showDeleted === '1') {
          // include both
        } else {
          finalRelaxed = relaxed.filter((c: any) => c.deletedAt == null)
        }

        // Only if query had no structural filters besides date should we return everything.
        const hasStructuralFilters = Boolean(
          parsed.company || parsed.city || parsed.role || (parsed.missing && parsed.missing.length) || (parsed.present && parsed.present.length) || (parsed.keywords && parsed.keywords.length)
        )

        if (finalRelaxed.length === 0 && !hasStructuralFilters) {
          try {
            const broad = await prisma.contact.findMany({ orderBy: { [sortField]: 'desc' } })
            finalRelaxed = broad.map((doc: any) => {
              const id = doc?._id?.$oid ?? doc?._id?.toString?.() ?? String(doc?._id ?? doc.id ?? '')
              const createdAt = toDateLocal(doc.createdAt)
              const updatedAt = toDate(doc.updatedAt) ?? createdAt
              const deletedAt = toDate(doc.deletedAt)
              const expiresAt = toDate(doc.expiresAt)
              return { ...doc, id, _id: undefined, createdAt, updatedAt, deletedAt, expiresAt, _broadened: true }
            })
            if (showDeleted === 'only') finalRelaxed = finalRelaxed.filter((c: any) => c.deletedAt != null)
            else if (showDeleted !== '1') finalRelaxed = finalRelaxed.filter((c: any) => c.deletedAt == null)
          } catch (fallbackErr) {
            // ignore, return empty
          }
        }

        return NextResponse.json(finalRelaxed)
      } catch (e) {
        console.error('search broaden failed', e)
        // fall through to returning the empty array
      }
    }

    return NextResponse.json(contacts)
  } catch (err) {
    console.error('POST /api/search error:', err)
    const message = err instanceof Error ? err.message : 'server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
