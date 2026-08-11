/**
 * The origin the client actually used. Behind a CDN or proxy the app is reached on an internal
 * host, which would put unreachable URLs in a card's interfaces and an unfetchable image in the
 * link previews, so the forwarded headers are the only trustworthy source.
 */
export function forwardedOrigin(headers: { get(name: string): string | null }): string | null {
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (!host) {
    return null
  }

  const protocol = headers.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${host}`
}
