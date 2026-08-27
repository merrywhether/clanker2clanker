import { generateAgentCard } from './agent-card'
import {
  CardConfig,
  DEFAULT_REDIRECT_STATUS,
  parseAuthorizationConfig,
  parseConfig,
  serializeConfig,
} from './agent-card/config'
import { malformedBody } from './agent-card/failure'
import { forwardedOrigin } from './origin'

/** Where an A2A agent publishes its card. `agent.json` is the pre-1.0 location. */
export const WELL_KNOWN_PATHS = ['/.well-known/agent-card.json', '/.well-known/agent.json'] as const

const [PRIMARY_PATH] = WELL_KNOWN_PATHS

export async function agentCardResponse(request: Request, path: string): Promise<Response> {
  const url = new URL(request.url)
  // The header is the only channel a caller has when it fetches a bare host, so it wins over the
  // query string, which is here for reaching the endpoint by hand.
  const config =
    parseAuthorizationConfig(request.headers.get('authorization')) ??
    parseConfig(url.searchParams)

  // Ahead of everything, so a slow response is slow whatever it eventually answers.
  if (config.delay) {
    await sleep(config.delay)
  }

  if (config.legacy && path === PRIMARY_PATH) {
    return notPublishedHere()
  }

  // Generated even when the response throws it away, so the echoed config always reports the seed
  // that was in play and a failing request stays comparable to the succeeding one beside it.
  const { card, config: effective } = generateAgentCard({
    origin: requestOrigin(request),
    config,
  })
  const echo = serializeConfig(effective)

  if (config.redirect) {
    return redirectResponse(config, echo)
  }

  if (config.malformed) {
    const { body, contentType } = malformedBody(config.malformed, card, effective.seed as string)
    return new Response(body, {
      status: config.status ?? 200,
      headers: { ...responseHeaders(echo, config.status), 'content-type': contentType },
    })
  }

  if (config.status) {
    return Response.json(
      { error: 'requested by the caller', status: config.status },
      { status: config.status, headers: responseHeaders(echo, config.status) }
    )
  }

  return Response.json(card, { headers: responseHeaders(echo) })
}

/**
 * A `status` in the 3xx range picks the redirect's flavour, since permanent, temporary and
 * method-preserving redirects are different things to a caller. Anything else falls back rather
 * than answering a 404 with a `Location` nobody would look at.
 */
function redirectResponse(config: CardConfig, echo: string): Response {
  const status = isRedirectStatus(config.status) ? config.status : DEFAULT_REDIRECT_STATUS

  return new Response(null, {
    status,
    headers: { ...responseHeaders(echo), location: config.redirect as string },
  })
}

function isRedirectStatus(status: number | undefined): status is number {
  return status !== undefined && status >= 300 && status < 400
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

function responseHeaders(config?: string, status?: number): HeadersInit {
  return {
    // Every request is meant to yield a different card, so an intermediary holding one would
    // defeat the point of the service.
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex',
    ...(config && { 'x-card-config': config }),
    // A 401 without this is malformed by the spec. Worth sending, but do not count on it: the CDN
    // in front of the deployed site strips this header, so only a direct origin fetch sees it.
    ...(status === 401 && { 'www-authenticate': 'Bearer realm="clanker2clanker"' }),
  }
}

function requestOrigin(request: Request): string {
  return forwardedOrigin(request.headers) ?? new URL(request.url).origin
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
