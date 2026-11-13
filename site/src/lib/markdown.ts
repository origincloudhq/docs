import { dirname, resolve } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { toRoute } from './remark-doc-links.mjs'
import { availabilityLabel, urlOf, type Doc, type Guide } from './nav'

/**
 * The Markdown version of every page, for agents and LLM tools: the scheme of
 * llmstxt.org and origincloud.eu. `/docs/compute/` has its Markdown at
 * `/docs/compute/index.html.md`.
 *
 * Made from the page's own Markdown, transformed the way the HTML build
 * transforms it, so the two say the same thing: the title from the front
 * matter instead of the body's first heading, HTML comments dropped (the HTML
 * doesn't show them), and links rewritten, here to the absolute URL of the
 * linked page's Markdown version, so the file works on its own. Diagrams stay
 * Mermaid source. What the HTML adds from the front matter (availability,
 * lead, specs, related pages) is added here too; the front matter itself is
 * reduced to the title and description.
 *
 * The source text is edited in place at the positions the parser reports, not
 * parsed and printed again, so tables, code and emphasis stay as written.
 */

export const MARKDOWN_FILE = 'index.html.md'

const SITE = import.meta.env.SITE ?? 'https://docs.origincloud.eu'

/** `/docs/compute/` -> `/docs/compute/index.html.md`. */
export const markdownPath = (route: string): string => `${route}${MARKDOWN_FILE}`

/** The absolute URL of a route's Markdown version. */
export const markdownUrl = (route: string): string => new URL(markdownPath(route), SITE).href

/** An absolute URL on this site, with a page route turned into its Markdown version. */
const toMarkdownLink = (url: URL): string => {
  if (url.origin === new URL(SITE).origin && url.pathname.startsWith('/docs/') && url.pathname.endsWith('/')) {
    url.pathname = markdownPath(url.pathname)
  }
  return url.href
}

const ABSOLUTE = /^[a-z][a-z0-9+.-]*:/i

/** Where a link in `entry` leads, as an absolute URL. */
const linkTarget = (entry: Doc, url: string): string => {
  if (ABSOLUTE.test(url)) return url
  const hash = url.indexOf('#')
  const path = hash === -1 ? url : url.slice(0, hash)
  const anchor = hash === -1 ? '' : url.slice(hash)
  const page = new URL(urlOf(entry), SITE)
  if (!path.endsWith('.md')) return toMarkdownLink(new URL(url, page))
  const route = toRoute(resolve(dirname(resolve(entry.filePath!)), path))
  if (!route) throw new Error(`${entry.filePath}: links outside docs/: ${url}`)
  return toMarkdownLink(new URL(route + anchor, SITE))
}

interface Node {
  type: string
  depth?: number
  url?: string
  label?: string
  value?: string
  children?: Node[]
  position?: { start: { offset?: number }; end: { offset?: number } }
}

interface Edit { start: number; end: number; text: string }

const parser = unified().use(remarkParse).use(remarkGfm)

const COMMENT = /^<!--(?:(?!-->)[\s\S])*-->$/

const span = (node: Node): [number, number] => {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) throw new Error(`a ${node.type} without a source position`)
  return [start, end]
}

/** The page body as rendered: without its own title, comments, or relative links. */
const bodyOf = (entry: Doc): string => {
  const src = entry.body ?? ''
  const tree = parser.parse(src) as Node
  const edits: Edit[] = []
  let nodes = tree.children ?? []

  // Removes a node; a block of the page's own takes its blank lines with it.
  const remove = (node: Node, block: boolean) => {
    let [start, end] = span(node)
    if (block) while (src[end] === '\n') end++
    edits.push({ start, end, text: '' })
  }

  // The body's first heading is the title, which the page takes from the
  // front matter (remark-strip-title.mjs).
  const first = nodes[0]
  if (first?.type === 'heading' && first.depth === 1) {
    remove(first, true)
    nodes = nodes.slice(1)
  }

  const visit = (node: Node, block = false) => {
    if (node.type === 'html' && COMMENT.test((node.value ?? '').trim())) {
      remove(node, block)
      return
    }
    if ((node.type === 'link' || node.type === 'definition') && node.url !== undefined) {
      const to = linkTarget(entry, node.url)
      if (to !== node.url) {
        // The target is the source text after the link text (or the label).
        const [start, end] = span(node)
        const after = node.type === 'link'
          ? (node.children?.length ? span(node.children[node.children.length - 1])[1] : start)
          : start + (node.label?.length ?? 0)
        const at = src.indexOf(node.url, after)
        if (at === -1 || at + node.url.length > end) {
          throw new Error(`${entry.filePath}: cannot find the link target ${node.url} in the source`)
        }
        edits.push({ start: at, end: at + node.url.length, text: to })
      }
    }
    node.children?.forEach((child) => visit(child))
  }
  nodes.forEach((node) => visit(node, true))

  let out = src
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end)
  return out.trim()
}

/** The page as rendered, from its title down, without front matter. */
export function pageMarkdown(entry: Doc, siblings: Doc[]): string {
  const d = entry.data
  const parts = [`# ${d.title}`]
  const availability = availabilityLabel(entry)
  if (availability) parts.push(availability)
  if (d.lead) parts.push(d.lead)
  if (d.specs?.length) parts.push(d.specs.map((s) => `- ${s.label}: ${s.value}`).join('\n'))
  const body = bodyOf(entry)
  if (body) parts.push(body)

  const byId = new Map(siblings.map((s) => [s.data.id, s]))
  const related = (d.related ?? []).map((id) => byId.get(id)).filter((r): r is Doc => !!r)
  if (related.length) {
    parts.push('## Related pages', related.map((r) => `- ${listItem(r)}`).join('\n'))
  }
  return parts.join('\n\n') + '\n'
}

/** `[Title](markdown URL): description`, as llms.txt lists a page. */
export const listItem = (entry: Doc): string =>
  `[${entry.data.title}](${markdownUrl(urlOf(entry))}): ${entry.data.description}`

/** A Markdown file with the title and description as its front matter. */
export const withFrontMatter = (title: string, description: string, body: string): string =>
  // JSON strings are YAML double-quoted strings.
  `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}`

/**
 * Pages in one file, for llms-full.txt: each page as rendered, its title
 * followed by a `Source:` line with its Markdown URL. scripts/scan.py reads
 * that line to know which page the text belongs to.
 */
export const fullText = (guides: Guide[]): string =>
  guides
    .flatMap((g) => g.pages.map((p) => {
      const [title, ...rest] = pageMarkdown(p, g.pages).split('\n')
      return [title, '', `Source: ${markdownUrl(urlOf(p))}`, ...rest].join('\n')
    }))
    .join('\n')

export const MARKDOWN_HEADERS = { 'Content-Type': 'text/markdown; charset=utf-8' }
export const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' }
