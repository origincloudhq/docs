import { version } from '../lib/source'

/** /version.json: the content and site commits this build was made from. */
export function GET() {
  return new Response(JSON.stringify(version(), null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json' },
  })
}
