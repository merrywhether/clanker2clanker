import { generateAgentCard } from './agent-card'
import { parseAuthorizationConfig, parseConfig, serializeConfig } from './agent-card/config'

/** Where an A2A agent publishes its card. `agent.json` is the pre-1.0 location. */
export const WELL_KNOWN_PATHS = ['/.well-known/agent-card.json', '/.well-known/agent.json'] as const

const [PRIMARY_PATH] = WELL_KNOWN_PATHS

export function agentCardResponse(request: Request, path: string): Response {
  const url = new URL(request.url)
  // The header is the only channel a caller has when it fetches a bare host, so it wins over the
  // query string, which is here for reaching the endpoint by hand.
  const config =
    parseAuthorizationConfig(request.headers.get('authorization')) ??
    parseConfig(url.searchParams)

  if (config.legacy && path === PRIMARY_PATH) {
    return notPublishedHere()
  }

  const { card, config: effective } = generateAgentCard({
    origin: requestOrigin(request),
    config,
  })

  return Response.json(card, { headers: responseHeaders(serializeConfig(effective)) })
}

/**
 * What a host that only publishes at the pre-1.0 path answers here. A reader is expected to try
 * the other location on a 404, so the body only has to be legible to a human.
 */
function notPublishedHere(): Response {
  return Response.json(
    { error: 'no agent card at this path', see: WELL_KNOWN_PATHS[1] },
    { status: 404, headers: responseHeaders() }
  )
}

function responseHeaders(config?: string): HeadersInit {
  return {
    // Every request is meant to yield a different card, so an intermediary holding one would
    // defeat the point of the service.
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex',
    ...(config && { 'x-card-config': config }),
  }
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
