import { generateAgentCard } from './agent-card'

/** Where an A2A agent publishes its card. `agent.json` is the pre-1.0 location. */
export const WELL_KNOWN_PATHS = ['/.well-known/agent-card.json', '/.well-known/agent.json'] as const

export function agentCardResponse(request: Request): Response {
  const { card, seed } = generateAgentCard({ origin: requestOrigin(request) })

  return Response.json(card, {
    headers: {
      // Every request is meant to yield a different card, so an intermediary holding one would
      // defeat the point of the service.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'x-card-seed': seed,
    },
  })
}

/**
 * Behind a CDN or proxy `request.url` carries the internal origin the app was reached on, which
 * would put an unreachable URL in the card's interfaces. The forwarded headers carry the one the
 * client actually used.
 */
function requestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!forwardedHost) {
    return new URL(request.url).origin
  }

  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${forwardedHost}`
}
