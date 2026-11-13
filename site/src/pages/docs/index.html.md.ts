import { guidesInOrder, urlOf } from '../../lib/nav'
import { MARKDOWN_HEADERS, markdownUrl, withFrontMatter } from '../../lib/markdown'
import { LANDING_DESCRIPTION, LANDING_LEAD, LANDING_TITLE, OFFSITE } from '../../lib/landing'

/** /docs/index.html.md: the landing page in Markdown, one link per guide. */
export async function GET() {
  const guides = await guidesInOrder()
  const body = [
    `# ${LANDING_TITLE}`,
    LANDING_LEAD,
    '## Service guides',
    guides
      .map(({ root }) => `- [${root.data.nav_title ?? root.data.title}](${markdownUrl(urlOf(root))}): ${root.data.description}`)
      .join('\n'),
    '## On origincloud.eu',
    OFFSITE.map((o) => `- [${o.title}](${o.href}): ${o.text}`).join('\n'),
  ].join('\n\n') + '\n'
  return new Response(withFrontMatter(LANDING_TITLE, LANDING_DESCRIPTION, body), { headers: MARKDOWN_HEADERS })
}
