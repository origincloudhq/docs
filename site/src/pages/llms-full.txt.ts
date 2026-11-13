import { guidesInOrder } from '../lib/nav'
import { TEXT_HEADERS, fullText } from '../lib/markdown'

/** /llms-full.txt: every page in one file, in the order of llms.txt. */
export async function GET() {
  return new Response(fullText(await guidesInOrder()), { headers: TEXT_HEADERS })
}
