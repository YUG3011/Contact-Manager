const http = require('http')

function postJson(path, body){
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    const req = http.request(opts, (res) => {
      let out = ''
      res.setEncoding('utf8')
      res.on('data', (d) => out += d)
      res.on('end', () => {
        try {
          resolve(JSON.parse(out))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function run(){
  const qs = [
    'recently added contacts',
    'people working at google',
    'contacts from Mumbai',
    'contacts updated last week from google company',
    'recent IT company contacts from Delhi',
    'people I edited yesterday from Mumbai',
    'contacts from google updated in last 7 days',
    'contacts updated in last 7 days',
    'contacts created yesterday',
    'people with missing email',
    'contacts without phone number',
    'contacts from "Google"',
    'contacts updated last week from Infotech company',
    'people working at Google updated in last 30 days',
    'people with email',
    'people with phone number',
    'people with city',
    'people with company',
    'people with role'
  ]

  for(const q of qs){
    console.log('\n=== QUERY:', q, '===')
    try{
      const json = await postJson('/api/search', { q })
      console.log(JSON.stringify(json, null, 2).slice(0,2000))
      console.log('\n-- total:', Array.isArray(json)?json.length: (json && json.length) || 0)
    }catch(e){
      console.error('ERROR', e && e.stack ? e.stack : e)
    }
  }
}

run()
