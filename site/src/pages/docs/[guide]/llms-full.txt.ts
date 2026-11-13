import type { APIRoute } from 'astro'
import { guidesInOrder, type Guide } from '../../../lib/nav'
import { TEXT_HEADERS, fullText } from '../../../lib/markdown'

/** /docs/<guide>/llms-full.txt: one guide's pages in one file, in navigation order. */
export async function getStaticPaths() {
  return (await guidesInOrder()).map((guide) => ({ params: { guide: guide.name }, props: { guide } }))
}

export const GET: APIRoute = ({ props }) =>
  new Response(fullText([(props as { guide: Guide }).guide]), { headers: TEXT_HEADERS })
