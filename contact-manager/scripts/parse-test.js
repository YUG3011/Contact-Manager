function parseQuery(q) {
  const txt = (q || '').toString().trim()
  const lower = txt.toLowerCase()
  const filters = { keywords: [] }

  let m = lower.match(/last\s+(\d+)\s+days?/) || lower.match(/in\s+last\s+(\d+)\s+days?/) || lower.match(/last\s+(\d+)\s+weeks?/) || lower.match(/last\s+(\d+)\s+months?/) || lower.match(/last\s+week/) || lower.match(/yesterday|today/)
  if (m) {
    const makeAfter = (d) => d
    if (/yesterday/.test(lower)) {
      const d = new Date(); d.setDate(d.getDate() - 1); filters.updatedAfter = makeAfter(d)
    } else if (/today/.test(lower)) {
      const d = new Date(); d.setHours(0,0,0,0); filters.updatedAfter = makeAfter(d)
    } else if (/last\s+week/.test(lower)) {
      const d = new Date(); d.setDate(d.getDate() - 7); filters.updatedAfter = makeAfter(d)
    } else if (m[1]) {
      const n = Number(m[1])
      if (!Number.isNaN(n)) {
        if (/week/.test(m[0])) {
          const d = new Date(); d.setDate(d.getDate() - n * 7); filters.updatedAfter = makeAfter(d)
        } else if (/month/.test(m[0])) {
          const d = new Date(); d.setMonth(d.getMonth() - n); filters.updatedAfter = makeAfter(d)
        } else {
          const d = new Date(); d.setDate(d.getDate() - n); filters.updatedAfter = makeAfter(d)
        }
      }
    }
  }

  let mCreated = lower.match(/added\s+(in\s+)?last\s+(\d+)\s+days?/) || lower.match(/added\s+today|added\s+yesterday|created\s+today|created\s+yesterday/)
  if (mCreated) {
    if (/yesterday/.test(lower)) {
      const d = new Date(); d.setDate(d.getDate() - 1); filters.createdAfter = d
    } else if (/today/.test(lower)) {
      const d = new Date(); d.setHours(0,0,0,0); filters.createdAfter = d
    } else if (mCreated[2]) {
      const n = Number(mCreated[2])
      if (!Number.isNaN(n)) {
        const d = new Date(); d.setDate(d.getDate() - n); filters.createdAfter = d
      }
    }
  }

  m = lower.match(/from\s+([\w\-\.&\s]+)/)
  if (m) filters.company = m[1].trim()
  m = lower.match(/at\s+([\w\-\.&\s]+)/)
  if (m && !filters.company) filters.company = m[1].trim()
  m = lower.match(/company\s+([\w\-\.&\s]+)/)
  if (m && !filters.company) filters.company = m[1].trim()

  m = lower.match(/in\s+([A-Za-z\s]+)/)
  if (m && !filters.company) {
    const word = m[1].trim()
    if (word && word.length < 30) filters.city = word
  }

  let cleaned = txt
  if (filters.company) cleaned = cleaned.replace(new RegExp(filters.company, 'i'), ' ')
  if (filters.city) cleaned = cleaned.replace(new RegExp(filters.city, 'i'), ' ')
  cleaned = cleaned.replace(/\b(updated|edited|modified|added|created|last|in|days?|weeks?|months?|yesterday|today|missing|without|no|from|at|company|contacts|people|i)\b/gmi, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  if (cleaned) filters.keywords = cleaned.split(' ').filter(Boolean)

  if ((/\b(updated|edited|modified)\b/.test(lower)) && !filters.updatedAfter && /recent|recently|last/.test(lower)) {
    const d = new Date(); d.setDate(d.getDate() - 7); filters.updatedAfter = d
  }

  return filters
}

const tests = [
  'people I updated last week',
  'contacts updated yesterday',
  'people with missing email',
  'contacts updated in last 7 days from Infotech'
]

tests.forEach(t => {
  console.log('\n---', t)
  console.log(parseQuery(t))
})
