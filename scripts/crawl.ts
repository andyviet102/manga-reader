import { google } from 'googleapis'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'

config()

const API_KEY = process.env.GOOGLE_API_KEY
const FOLDER_ID = process.env.DRIVE_FOLDER_ID

if (!API_KEY || !FOLDER_ID) {
  console.error('Set GOOGLE_API_KEY and DRIVE_FOLDER_ID in .env')
  process.exit(1)
}

const drive = google.drive({ version: 'v3', auth: API_KEY })

async function listAll(query: string, fields = 'files(id,name)') {
  const items: any[] = []
  let pageToken: string | undefined
  do {
    const res = await drive.files.list({
      q: query,
      fields: `nextPageToken,${fields}`,
      pageSize: 1000,
      pageToken,
      orderBy: 'name',
    })
    items.push(...(res.data.files || []))
    pageToken = res.data.nextPageToken || undefined
  } while (pageToken)
  return items
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

async function main() {
  console.log('Fetching chapters from root folder...')
  const folders = await listAll(
    `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )
  folders.sort((a, b) => naturalSort(a.name!, b.name!))
  console.log(`Found ${folders.length} chapters`)

  const chapters: { name: string; pages: string[] }[] = []

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    const files = await listAll(
      `'${folder.id}' in parents and mimeType contains 'image/' and trashed=false`
    )
    const filtered = files.filter(f => !f.name!.startsWith('._'))
    filtered.sort((a, b) => naturalSort(a.name!, b.name!))
    chapters.push({ name: folder.name!, pages: filtered.map(f => f.id!) })
    process.stdout.write(`\r  Crawled ${i + 1}/${folders.length}: ${folder.name}`)
  }

  console.log('\nWriting data.json...')
  const output = { title: 'Manga Reader', chapters }
  writeFileSync('src/data.json', JSON.stringify(output, null, 2))
  console.log(`Done! ${chapters.length} chapters, ${chapters.reduce((s, c) => s + c.pages.length, 0)} pages total.`)
}

main().catch(console.error)
