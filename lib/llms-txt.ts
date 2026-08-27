import {
  AUTO_VERSION,
  DEFAULT_REDIRECT_STATUS,
  DELAY_MAX_MS,
  INTERFACES_RANGE,
  MALFORMED_DESCRIPTIONS,
  MALFORMED_KINDS,
  SKILLS_RANGE,
  STATUS_RANGE,
} from './agent-card'
import { WELL_KNOWN_PATHS } from './well-known'

const [PRIMARY_PATH, LEGACY_PATH] = WELL_KNOWN_PATHS
const [STATUS_MIN, STATUS_MAX] = STATUS_RANGE

/**
 * The site's own documentation, for whatever arrives without a human attached. The landing page
 * spells the grammar out in controls rather than prose, and the README is not served, so this is
 * the only place on the site a reader can learn what the header accepts.
 *
 * Built from the codec's constants rather than written out, for the same reason the page is: a
 * hand-maintained copy of a parser's rules is a copy that will eventually be wrong.
 */
export function llmsTxt(origin: string): string {
  const url = (path: string) => `${origin}${path}`
  const curl = (config: string) => `curl -H 'Authorization: Bearer ${config}' ${url(PRIMARY_PATH)}`

  return [
    '# clanker2clanker',
    '',
    '> Randomly generated A2A v1.0.0 agent cards, served at the well-known URI and on a page you',
    '> can copy from. For testing something that consumes agent cards without hand-writing one.',
    '',
    'Nothing here is a real agent. A card advertises interface URLs on this same host and nothing',
    'answers on them. Every request returns a different card unless you pin a seed.',
    '',
    '## Routes',
    '',
    `- [${PRIMARY_PATH}](${url(PRIMARY_PATH)}): A generated card.`,
    `- [${LEGACY_PATH}](${url(LEGACY_PATH)}): The same card, at the pre-1.0 location.`,
    `- [/](${origin}): A page that generates a card in the browser, with controls for every option`,
    '  below and the exact header they produce.',
    '',
    'Both routes answer `application/json` with `Cache-Control: no-store`. The options that were',
    'actually applied come back in the `X-Card-Config` response header.',
    '',
    '## Options',
    '',
    'Options are an encoded query string. Send them in the `Authorization` header — an auth scheme',
    'in front is tolerated and ignored — or in the URL when fetching by hand. The header wins.',
    '',
    '```sh',
    curl('seed=abc&skills=3'),
    `curl '${url(PRIMARY_PATH)}?seed=abc&skills=3'`,
    '```',
    '',
    '| Option | Effect |',
    '|---|---|',
    '| `seed` | Reproduces a card exactly. Omit for a new one every request. |',
    `| \`version\` | \`${AUTO_VERSION}\` stamps the fetch time into the patch segment; anything else is used verbatim. |`,
    '| `name`, `description`, `documentationUrl`, `iconUrl` | Set outright. |',
    `| \`skills\` | Fix the count, ${SKILLS_RANGE[0]}–${SKILLS_RANGE[1]}. |`,
    `| \`interfaces\` | Fix the count, ${INTERFACES_RANGE[0]}–${INTERFACES_RANGE[1]}. |`,
    '| `extras` | Add the non-spec vendor keys real cards carry. |',
    `| \`legacy\` | Publish only at \`${LEGACY_PATH}\`, so the primary path 404s. |`,
    '',
    '## Making it fail',
    '',
    'A reader has more than one way to not get a card, and most are awkward to reach on purpose.',
    'These make the well-known routes fail on request, in the same encoded string.',
    '',
    '| Option | Effect |',
    '|---|---|',
    `| \`status\` | Answer with this code instead of 200. ${STATUS_MIN}–${STATUS_MAX}. |`,
    `| \`redirect\` | Answer with a redirect here, absolute or rooted. ${DEFAULT_REDIRECT_STATUS} unless \`status\` names another 3xx. |`,
    '| `malformed` | Answer 200 with something that is not a usable card. |',
    `| \`delay\` | Hold the response open this many milliseconds first, up to ${DELAY_MAX_MS}. |`,
    '',
    '`malformed` takes the kind of broken you want. A bare `malformed` means the first below.',
    '',
    '| Kind | Body |',
    '|---|---|',
    ...MALFORMED_KINDS.map((kind) => `| \`${kind}\` | ${MALFORMED_DESCRIPTIONS[kind]} |`),
    '',
    '```sh',
    curl('status=503'),
    curl('redirect=https://elsewhere.example/agent-card.json&status=308'),
    curl('malformed=shape'),
    curl(`delay=${DELAY_MAX_MS}`),
    '```',
    '',
    'They compose: `status=503&malformed=html` is a 503 with an HTML body, and `delay` applies to',
    'whatever the response turns out to be.',
    '',
    '## Two things that will save you a debugging session',
    '',
    'An option that would produce an unimportable card, or a value out of range, is **dropped, not',
    'rejected and not clamped** — the request still succeeds, just without that option. If a knob',
    'seems to have done nothing, read `X-Card-Config`, which lists only what actually applied.',
    '',
    'Failures are seeded exactly as cards are. Every malformed body is derived from the card the',
    'seed produced, so two identical seeded requests are byte-identical whether they succeed or',
    'fail. Pin a seed when you need a response to repeat.',
    '',
    '## What a card is always like',
    '',
    'The generator is happy-path only. The failure options above decide what the route does with a',
    'card, never what a card is, so unless you asked for a failure the body is an importable card:',
    'a JSON object with a non-empty name, description, and exact-semver version, at least one skill',
    'and one supported interface, and no pre-1.0 fields mixed into the v1.0.0 interface shape.',
    '',
  ].join('\n')
}
