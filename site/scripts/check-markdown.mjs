// Fails the build when the Markdown versions of the site disagree with its
// HTML (src/lib/markdown.ts):
//
// - a built page without its index.html.md next to it, or without the
//   <link rel="alternate" type="text/markdown"> in its head that names it;
// - a link in a Markdown version, llms.txt or an llms-full.txt that is
//   relative, or that points into this site at a file that was not built;
// - llms.txt not listing every page exactly once, or an llms-full.txt not
//   holding every page of its scope exactly once.
//
// Runs on dist/, after astro build.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import config from '../astro.config.mjs'

const DIST = resolve('dist')
const SITE = new URL(config.site)
const MARKDOWN = 'index.html.md'

if (!existsSync(DIST)) {
  console.error('check-markdown: no dist/: run astro build first')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const files = walk(DIST).map((f) => relative(DIST, f).replace(/\\/g, '/'))
const problems = []

// Every page has its Markdown version, and announces it.
const html = files.filter((f) => f.endsWith('/index.html'))
const markdown = new Set(files.filter((f) => f.endsWith(`/${MARKDOWN}`)))
for (const page of html) {
  const md = page.replace(/index\.html$/, MARKDOWN)
  if (!markdown.has(md)) problems.push(`${page}: no Markdown version (${md})`)
  const head = readFileSync(join(DIST, page), 'utf8').match(/<head>[\s\S]*<\/head>/)?.[0] ?? ''
  const alternate = [...head.matchAll(/<link\b[^>]*>/g)].map((m) => m[0])
    .find((l) => /rel="alternate"/.test(l) && /type="text\/markdown"/.test(l))
  if (alternate?.match(/href="([^"]*)"/)?.[1] !== `/${md}`) {
    problems.push(`${page}: its head doesn't announce /${md} as <link rel="alternate" type="text/markdown">`)
  }
}
for (const md of markdown) {
  if (!html.includes(md.replace(/\.md$/, ''))) problems.push(`${md}: a Markdown version without its page`)
}

// Every link in the Markdown resolves.
const parser = unified().use(remarkParse).use(remarkGfm)
const linksOf = (text) => {
  const urls = []
  const visit = (node) => {
    if ((node.type === 'link' || node.type === 'definition') && node.url) urls.push(node.url)
    node.children?.forEach(visit)
  }
  visit(parser.parse(text))
  return urls
}

/** The dist/ file a URL on this site is served from, or null for one elsewhere. */
const fileOf = (url) => {
  if (url.origin !== SITE.origin) return null
  const path = decodeURIComponent(url.pathname).replace(/^\//, '')
  return path === '' || path.endsWith('/') ? `${path}index.html` : path
}

const fullTexts = files.filter((f) => f === 'llms-full.txt' || /^docs\/[^/]+\/llms-full\.txt$/.test(f))
const texts = [...markdown, 'llms.txt', ...fullTexts]
if (!files.includes('llms.txt')) problems.push('no llms.txt')

for (const f of texts.filter((t) => files.includes(t))) {
  for (const href of linksOf(readFileSync(join(DIST, f), 'utf8'))) {
    let url
    try {
      url = new URL(href)
    } catch {
      problems.push(`${f}: a relative link -> ${href}`)
      continue
    }
    const target = fileOf(url)
    if (target !== null && !files.includes(target)) problems.push(`${f}: link to a file that was not built -> ${href}`)
  }
}

// llms.txt lists every page once, and each llms-full.txt holds every page of
// its scope once (the landing page /docs/ is neither: it lists the guides).
const pages = [...markdown].filter((m) => m !== `docs/${MARKDOWN}`).sort()
const listed = (f, pattern) =>
  [...readFileSync(join(DIST, f), 'utf8').matchAll(pattern)].map((m) => fileOf(new URL(m[1])) ?? m[1])

const compare = (f, got, want) => {
  const seen = new Set()
  for (const g of got) {
    if (seen.has(g)) problems.push(`${f}: lists ${g} more than once`)
    seen.add(g)
  }
  for (const w of want) if (!seen.has(w)) problems.push(`${f}: doesn't list ${w}`)
  for (const g of seen) if (!want.includes(g)) problems.push(`${f}: lists ${g}, which is not a page`)
}

if (files.includes('llms.txt')) compare('llms.txt', listed('llms.txt', /^- \[[^\]]*\]\((\S+)\)/gm), pages)

const guides = [...new Set(pages.map((p) => p.split('/')[1]))]
for (const g of guides) {
  if (!files.includes(`docs/${g}/llms-full.txt`)) problems.push(`docs/${g}/: no llms-full.txt`)
}
if (!files.includes('llms-full.txt')) problems.push('no llms-full.txt')
for (const f of fullTexts) {
  const scope = f === 'llms-full.txt' ? 'docs/' : f.replace(/llms-full\.txt$/, '')
  compare(f, listed(f, /^Source: (\S+)$/gm), pages.filter((p) => p.startsWith(scope)))
}

for (const p of problems) console.error(`  ${p}`)
if (problems.length) {
  console.error(`\ncheck-markdown: ${problems.length} problem(s)`)
  process.exit(1)
}
console.log(
  `check-markdown: ${markdown.size} Markdown versions for ${html.length} pages, ` +
  `llms.txt and ${fullTexts.length} llms-full.txt files complete, all links resolve`
)
