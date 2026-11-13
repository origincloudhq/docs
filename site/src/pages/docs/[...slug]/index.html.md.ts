import type { APIRoute } from 'astro'
import { guidesInOrder, urlOf, type Doc } from '../../../lib/nav'
import { MARKDOWN_HEADERS, pageMarkdown, withFrontMatter } from '../../../lib/markdown'

/** The Markdown version of every page, next to its HTML (lib/markdown.ts). */
export async function getStaticPaths() {
  return (await guidesInOrder()).flatMap((g) =>
    g.pages.map((entry) => ({
      params: { slug: urlOf(entry).replace(/^\/docs\//, '').replace(/\/$/, '') },
      props: { entry, siblings: g.pages },
    }))
  )
}

export const GET: APIRoute = ({ props }) => {
  const { entry, siblings } = props as { entry: Doc; siblings: Doc[] }
  const md = withFrontMatter(entry.data.title, entry.data.description, pageMarkdown(entry, siblings))
  return new Response(md, { headers: MARKDOWN_HEADERS })
}
