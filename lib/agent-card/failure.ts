import type { MalformedKind } from './config'
import type { AgentCard } from './types'

export interface MalformedBody {
  body: string
  contentType: string
}

/** Big enough that any reader with a size limit hits it, small enough to still be worth serving. */
const HUGE_BYTES = 2 * 1024 * 1024

/** Where the JSON gets cut off — inside the structure, so it is unmistakably truncated. */
const TRUNCATE_AT = 0.6

/**
 * A 200 that still does not yield a card. Every kind is built from the card the seed produced
 * rather than from a canned string, so a malformed response reproduces byte for byte exactly as a
 * good one does — which is what keeps the "card unchanged" path testable on this side too.
 */
export function malformedBody(kind: MalformedKind, card: AgentCard, seed: string): MalformedBody {
  switch (kind) {
    case 'shape':
      return { body: JSON.stringify(wrongShape(card, seed), null, 2), contentType: 'application/json' }
    case 'syntax':
      return { body: truncated(card), contentType: 'application/json' }
    case 'html':
      return { body: errorPage(seed), contentType: 'text/html; charset=utf-8' }
    case 'huge':
      return { body: JSON.stringify(padded(card)), contentType: 'application/json' }
  }
}

/**
 * Valid JSON, plausibly a real API response, and not an agent card: the card is buried under an
 * envelope and the fields a reader validates on are gone from where it looks for them.
 */
function wrongShape(card: AgentCard, seed: string) {
  const { name, version, supportedInterfaces, ...rest } = card
  return { ok: true, requestId: seed, data: { agent: rest } }
}

/** Cut mid-structure, so it fails to parse rather than parsing to something small. */
function truncated(card: AgentCard): string {
  const json = JSON.stringify(card, null, 2)
  return json.slice(0, Math.floor(json.length * TRUNCATE_AT))
}

/**
 * What a host actually serves when it has no idea what the well-known path is: its own app shell or
 * error page, at 200, with a content type nothing checked.
 */
function errorPage(seed: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Not found</title></head>',
    `<body><h1>Not found</h1><p>No route matched. Request ${seed}.</p></body>`,
    '</html>',
  ].join('\n')
}

/**
 * A card that is otherwise fine and far too large to accept. The padding repeats the card's own
 * JSON, so its size is fixed but its bytes still follow the seed.
 */
function padded(card: AgentCard) {
  const chunk = JSON.stringify(card)
  const filler = chunk.repeat(Math.ceil(HUGE_BYTES / chunk.length)).slice(0, HUGE_BYTES)
  return { ...card, transcript: filler }
}
