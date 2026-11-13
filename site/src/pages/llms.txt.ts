import { guidesInOrder } from '../lib/nav'
import { TEXT_HEADERS, listItem } from '../lib/markdown'

/**
 * /llms.txt (https://llmstxt.org/): what Origin Cloud is, then one section per
 * guide listing every page, in navigation order, with its Markdown URL and
 * description. Generated from the content: a new page appears on the next
 * build.
 */
export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://docs.origincloud.eu')
  const guides = await guidesInOrder()
  const text = [
    '# Origin Cloud Docs',
    '> Origin Cloud is a European infrastructure cloud: virtual machines, block storage, private networks, ' +
      'DNS and access management, run in European data centers under EU jurisdiction, at published prices. ' +
      'These are its user guides, one per service, for anyone using the API, the `origin` CLI or the console.',
    'Every link below points to the Markdown version of a page; the HTML page is at the same URL without ' +
      '`index.html.md`, and announces its Markdown version with `<link rel="alternate" type="text/markdown">`. ' +
      `All pages in one file, in this order: <${new URL('/llms-full.txt', base).href}>. One guide's pages in one ` +
      `file: the guide's address with \`llms-full.txt\`, such as <${new URL('/docs/compute/llms-full.txt', base).href}>.`,
    ...guides.flatMap((g) => [
      `## ${g.root.data.nav_title ?? g.root.data.title}`,
      g.pages.map((p) => `- ${listItem(p)}`).join('\n'),
    ]),
  ].join('\n\n') + '\n'
  return new Response(text, { headers: TEXT_HEADERS })
}
