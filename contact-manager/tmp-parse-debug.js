const fs = require('fs')

function parseQuery(q) {
  // paste from route
  const txt = (q || '').toString().trim()
  const lower = txt.toLowerCase()
  const filters = { keywords: [] }

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startOfDay = (d) => { const nd = new Date(d); nd.setHours(0, 0, 0, 0); return nd }
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
  const hoursAgo = (n) => { const d = new Date(); d.setHours(d.getHours() - n); return d }
  const minutesAgo = (n) => { const d = new Date(); d.setMinutes(d.getMinutes() - n); return d }
  const secondsAgo = (n) => { const d = new Date(); d.setSeconds(d.getSeconds() - n); return d }
  const weeksAgo = (n) => daysAgo(n * 7)
  const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d }
  const yearsAgo = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return d }

  const wantsCreated = /\b(created|added|new|recently\s+added|recently\s+created|recently\s+added\s+contacts|recently\s+created\s+contacts|recently\s+added\b)\b/.test(lower)
  const wantsUpdated = /\b(updated|edited|modified)\b/.test(lower)
  const timeField = wantsCreated && !wantsUpdated ? 'createdAt' : 'updatedAt'

  const setAfter = (d) => {
    if (timeField === 'createdAt') filters.createdAfter = d
    else filters.updatedAfter = d
  }

  let m = null
  if (/\btoday\b/.test(lower)) setAfter(startOfDay(new Date()))
  if (/\byesterday\b/.test(lower)) setAfter(startOfDay(daysAgo(1)))
  if (/\blast\s+week\b/.test(lower)) setAfter(weeksAgo(1))
  if (/\blast\s+month\b/.test(lower)) setAfter(monthsAgo(1))

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

  if (/\blast\s+seconds?\b/.test(lower)) setAfter(secondsAgo(1))
  if (/\blast\s+minutes?\b|\blast\s+minuts?\b/.test(lower)) setAfter(minutesAgo(1))
  if (/\blast\s+hours?\b/.test(lower)) setAfter(hoursAgo(1))
  if (/\blast\s+year\b/.test(lower)) setAfter(yearsAgo(1))

  if (/\brecent(ly)?\b/.test(lower) && !filters.updatedAfter && !filters.createdAfter) setAfter(daysAgo(7))

  const quoted = Array.from(txt.matchAll(/"([^"]+)"/g)).map((x) => x[1]).filter(Boolean)
  let city
  let company

  const fromMatch = lower.match(/\bfrom\s+([^,]+?)(?:\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)
  const atMatch = lower.match(/\b(?:working\s+at|works\s+at|at)\s+([^,]+?)(?:\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)
  const inMatch = lower.match(/\bin\s+([^,]+?)(?:\s+with\b|\s+without\b|\s+no\b|\s+missing\b|\s+updated\b|\s+edited\b|\s+modified\b|\s+created\b|\s+added\b|\s+in\s+last\b|\s+last\b|$)/)

  const candidateFrom = fromMatch?.[1]?.trim()
  const candidateAt = atMatch?.[1]?.trim()
  const candidateIn = inMatch?.[1]?.trim()

  const looksTimePhrase = (text) => /\b(last|today|yesterday)\b/.test(text) || /\d/.test(text)

  if (candidateIn && !/\bcompany\b/.test(candidateIn) && !looksTimePhrase(candidateIn)) city = candidateIn

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

  if (candidateAt) company = candidateAt
  if (!company && quoted.length) company = quoted[0]

  if (company) company = company.replace(/"/g, '').replace(/\b(company|contacts|people)\b/g, ' ').replace(/\s+/g, ' ').trim()
  if (city) city = city.replace(/"/g, '').replace(/\b(city|contacts|people)\b/g, ' ').replace(/\s+/g, ' ').trim()

  if (company) filters.company = company
  if (city) filters.city = city

  let role
  const roleMatch = lower.match(/\brole\s+([^,]+?)(?:\s+at\b|\s+in\b|\s+from\b|$)/)
  if (roleMatch) role = roleMatch[1].trim()
  const workingAsMatch = lower.match(/\bworking\s+as\s+([^,]+?)(?:\s+at\b|\s+in\b|\s+from\b|$)/)
  if (!role && workingAsMatch) role = workingAsMatch[1].trim()
  if (role) {
    role = role.replace(/\b(role|people|contacts)\b/g, ' ').replace(/\s+/g, ' ').trim()
    if (role) filters.role = role
  }

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

const queries = [
  'contacts updated in last 7 days',
  'contacts updated last week from google company',
  'recently added contacts',
  'people working at Google updated in last 30 days',
  'contacts from "Google"',
  'contacts from google updated in last 7 days',
  'contacts updated last week from Infotech company',
  'recent IT company contacts from Delhi'
]
for (const q of queries) {
  console.log('\n', q)
  console.log(parseQuery(q))
}
