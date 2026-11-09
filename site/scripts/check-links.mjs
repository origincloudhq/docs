// Fails the build on a broken link in docs/.
//
// The pages are exported from the source repository and link to each other with
// relative paths. A dead Markdown link renders perfectly happily, so nothing
// else catches one — and a page renamed upstream leaves every link to it
// pointing at nothing.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'

const ROOT = resolve('../docs')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []
  })

const files = walk(ROOT)

const slugify = (h) =>
  // Matches GitHub's slugger: underscores survive, so BAD_REQUEST -> bad_request.
  h.trim().toLowerCase().replace(/`/g, '').replace(/[^a-z0-9\-_ ]/g, '').replace(/ /g, '-')

// Heading anchors per file, so #fragments can be checked too.
const anchors = new Map()
for (const f of files) {
  anchors.set(
    f,
    new Set([...readFileSync(f, 'utf8').matchAll(/^#{1,6} (.+)$/gm)].map((m) => slugify(m[1])))
  )
}

let broken = 0
for (const f of files) {
  const body = readFileSync(f, 'utf8')
  for (const [, target] of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue

    const [path, anchor] = target.split('#')
    const abs = path ? resolve(dirname(f), path) : f

    if (!existsSync(abs)) {
      console.error(`  ${relative(ROOT, f)}: no such page -> ${target}`)
      broken++
      continue
    }
    if (anchor && anchors.has(abs) && !anchors.get(abs).has(anchor)) {
      console.error(`  ${relative(ROOT, f)}: no such heading -> ${target}`)
      broken++
    }
  }
}

if (broken) {
  console.error(`\ncheck-links: ${broken} broken link(s)`)
  process.exit(1)
}
console.log(`check-links: ${files.length} pages, all links resolve`)

// ---------------------------------------------------------------------------
// The source check above is necessary but not sufficient: it validates relative
// .md paths, which are correct in the tree and meaningless once rendered. A
// release shipped 797 dead links while this script reported success, because it
// never looked at the output. So if a build exists, check that too.
// ---------------------------------------------------------------------------
import { existsSync as exists } from 'node:fs'

const DIST = resolve('dist')
if (!exists(DIST)) {
  console.log('check-links: no dist/ yet — skipping the rendered check')
  process.exit(0)
}

const pages = walkHtml(DIST)
let renderedBroken = 0

for (const f of pages) {
  const html = readFileSync(f, 'utf8')

  // A relative .md href in the output means a link was never rewritten to a
  // route. An absolute one points at a file elsewhere, such as CONTRIBUTING.md.
  for (const [, href] of html.matchAll(/href="(?![a-z][a-z0-9+.-]*:)([^"]*\.md[^"]*)"/g)) {
    console.error(`  ${relative(DIST, f)}: unrewritten source link -> ${href}`)
    renderedBroken++
  }

  for (const href of new Set([...html.matchAll(/href="(\/docs\/[^"#]*)/g)].map((m) => m[1]))) {
    if (!exists(join(DIST, href, 'index.html'))) {
      console.error(`  ${relative(DIST, f)}: link to a page that was not built -> ${href}`)
      renderedBroken++
    }
  }
}

function walkHtml(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walkHtml(p) : name === 'index.html' ? [p] : []
  })
}

if (renderedBroken) {
  console.error(`\ncheck-links: ${renderedBroken} broken link(s) in the rendered site`)
  process.exit(1)
}
console.log(`check-links: ${pages.length} rendered pages, all internal links resolve`)
