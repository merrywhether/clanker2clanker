import { llmsTxt } from '@/lib/llms-txt'
import { forwardedOrigin } from '@/lib/origin'

// Dynamic for the origin alone: the examples have to name the host the reader actually reached,
// the way a card's interface URLs do.
export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  const origin = forwardedOrigin(request.headers) ?? new URL(request.url).origin

  return new Response(llmsTxt(origin), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
