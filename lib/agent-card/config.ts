/**
 * Generation options, in one shape that both surfaces share. The landing page keeps them in the
 * query string and the well-known route reads them from the `Authorization` header, so the same
 * encoded string works in either place and the page's controls double as the header's docs.
 */
export interface CardConfig {
  /** Omit for a fresh card each time; set it to reproduce one. */
  seed?: string
  skills?: number
  interfaces?: number
  /** Emit the non-spec vendor keys real cards carry, to exercise a reader's tolerance. */
  extras: boolean
  /** Publish only at the pre-1.0 path, so the primary one 404s and the fallback is reachable. */
  legacy: boolean
  overrides: Partial<Record<OverridableField, string>>

  /**
   * Failure injection. All off by default, and none of it touches the generator — a card is still
   * always importable, these only decide what the well-known route does with it. A reader that
   * classifies fetch failures needs each branch reachable, and a bogus hostname only reaches one.
   */
  /** Answer with this code instead of 200. A 3xx only redirects when `redirect` names a target. */
  status?: number
  /** Send a redirect to this location. Nothing is expected to follow it. */
  redirect?: string
  /** Answer 200 with a body that is not a usable agent card. */
  malformed?: MalformedKind
  /** Hold the response open this long first, to reach a fetch timeout on purpose. */
  delay?: number
}

/**
 * Literal-valued card fields that can be set outright. Nothing structural is overridable — the
 * counts above cover that — so a value here is always a plain string.
 */
export const OVERRIDABLE_FIELDS = [
  'name',
  'description',
  'version',
  'documentationUrl',
  'iconUrl',
] as const

export type OverridableField = (typeof OVERRIDABLE_FIELDS)[number]

/**
 * The ways a 200 can still fail to yield a card. Each one is derived from the card the seed would
 * have produced, so a malformed response is as reproducible as a good one.
 */
export const MALFORMED_KINDS = ['shape', 'syntax', 'html', 'huge'] as const

export type MalformedKind = (typeof MALFORMED_KINDS)[number]

const DEFAULT_MALFORMED: MalformedKind = 'shape'

/** `version=auto` stamps the fetch time into the patch segment. */
export const AUTO_VERSION = 'auto'

export const SKILLS_RANGE = [1, 10] as const
export const INTERFACES_RANGE = [1, 3] as const

/**
 * Below 300 there is nothing to inject: a 2xx is what the route does anyway, and the codes under it
 * are not outcomes a fetch reports back.
 */
export const STATUS_RANGE = [300, 599] as const

/**
 * Enough to clear a reader's fetch budget — five seconds, in the case this exists for — without
 * getting into the range where the platform's own timeouts are what answered rather than this.
 */
export const DELAY_MAX_MS = 8_000

/** What a redirect answers with when the caller names a target but no code. */
export const DEFAULT_REDIRECT_STATUS = 302

/** Matches version strings that name a range or an alias rather than one exact version. */
const VERSION_RANGE = /^[\^~]|^[><=]|\s-\s|[xX*]|^latest$/

const VERSION_MAX_LENGTH = 256

const REDIRECT_MAX_LENGTH = 2048

export const EMPTY_CONFIG: CardConfig = { extras: false, legacy: false, overrides: {} }

export function parseConfig(params: URLSearchParams): CardConfig {
  const config: CardConfig = { ...EMPTY_CONFIG, overrides: {} }

  const seed = params.get('seed')?.trim()
  if (seed) {
    config.seed = seed
  }

  config.skills = clampCount(params.get('skills'), SKILLS_RANGE)
  config.interfaces = clampCount(params.get('interfaces'), INTERFACES_RANGE)
  config.extras = parseBoolean(params.get('extras'))
  config.legacy = parseBoolean(params.get('legacy'))

  config.status = parseStatus(params.get('status'))
  config.redirect = parseRedirect(params.get('redirect'))
  config.malformed = parseMalformed(params.get('malformed'))
  config.delay = parseDelay(params.get('delay'))

  for (const field of OVERRIDABLE_FIELDS) {
    const value = params.get(field)?.trim()
    if (value && isUsableOverride(field, value)) {
      config.overrides[field] = value
    }
  }

  return config
}

/** The encoded form, stable enough to compare and to paste. Empty when nothing is set. */
export function serializeConfig(config: CardConfig): string {
  const params = new URLSearchParams()

  if (config.seed) {
    params.set('seed', config.seed)
  }
  if (config.skills) {
    params.set('skills', String(config.skills))
  }
  if (config.interfaces) {
    params.set('interfaces', String(config.interfaces))
  }
  if (config.extras) {
    params.set('extras', 'true')
  }
  if (config.legacy) {
    params.set('legacy', 'true')
  }
  if (config.status) {
    params.set('status', String(config.status))
  }
  if (config.redirect) {
    params.set('redirect', config.redirect)
  }
  if (config.malformed) {
    params.set('malformed', config.malformed)
  }
  if (config.delay) {
    params.set('delay', String(config.delay))
  }
  for (const field of OVERRIDABLE_FIELDS) {
    const value = config.overrides[field]
    if (value) {
      params.set(field, value)
    }
  }

  return params.toString()
}

/**
 * Read the config out of an `Authorization` header. The value is treated as the encoded form, with
 * an auth scheme tolerated in front so a caller that can only send a credential still gets through.
 */
export function parseAuthorizationConfig(header: string | null): CardConfig | null {
  if (!header) {
    return null
  }

  const value = header.replace(/^\s*\S+\s+/, (scheme) =>
    /^(bearer|basic|token)\s+$/i.test(scheme) ? '' : scheme
  )
  return parseConfig(new URLSearchParams(value.trim()))
}

/** Whether anything about this config keeps the route from answering with a card. */
export function isFailureConfig(config: CardConfig): boolean {
  return Boolean(config.status || config.redirect || config.malformed || config.delay)
}

/**
 * The version the card carries. `auto` stamps the fetch time into the patch segment, keeping the
 * seeded major and minor: the card stays identical between fetches while its version climbs, which
 * is what makes a refresh stack a new version instead of replacing an equal one.
 */
export function resolveVersion(seeded: string, override: string | undefined, now: Date): string {
  if (!override) {
    return seeded
  }
  if (override !== AUTO_VERSION) {
    return override
  }

  const [major = '1', minor = '0'] = seeded.split('.')
  return `${major}.${minor}.${utcStamp(now)}`
}

function utcStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('')
}

/**
 * Overrides that would produce a card no registry accepts are dropped rather than rejected: a
 * mistyped knob should still hand back a usable card, not turn the endpoint into an error.
 */
function isUsableOverride(field: OverridableField, value: string): boolean {
  if (field !== 'version') {
    return true
  }
  return (
    value === AUTO_VERSION || (value.length <= VERSION_MAX_LENGTH && !VERSION_RANGE.test(value))
  )
}

/** Out of range is dropped rather than clamped: a clamped status is a different test than asked. */
function parseStatus(raw: string | null): number | undefined {
  const value = Number(raw)
  const [min, max] = STATUS_RANGE
  if (!raw || !Number.isInteger(value) || value < min || value > max) {
    return undefined
  }
  return value
}

/**
 * Absolute or root-relative, and nothing else. The target is never fetched by anything here, but a
 * `Location` that is not a location makes the response itself the bug rather than the subject.
 */
function parseRedirect(raw: string | null): string | undefined {
  const value = raw?.trim()
  if (!value || value.length > REDIRECT_MAX_LENGTH) {
    return undefined
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function parseMalformed(raw: string | null): MalformedKind | undefined {
  if (raw === null) {
    return undefined
  }

  const value = raw.trim().toLowerCase()
  if (MALFORMED_KINDS.includes(value as MalformedKind)) {
    return value as MalformedKind
  }
  // A bare `malformed`, or a truthy word, asks for the default kind rather than nothing.
  return parseBoolean(value) ? DEFAULT_MALFORMED : undefined
}

function parseDelay(raw: string | null): number | undefined {
  const value = Number(raw)
  if (!raw || !Number.isInteger(value) || value <= 0) {
    return undefined
  }
  return Math.min(value, DELAY_MAX_MS)
}

function clampCount(raw: string | null, [min, max]: readonly [number, number]): number | undefined {
  const value = Number(raw)
  if (!raw || !Number.isInteger(value)) {
    return undefined
  }
  return Math.min(Math.max(value, min), max)
}

function parseBoolean(raw: string | null): boolean {
  return raw !== null && ['', 'true', '1', 'yes', 'on'].includes(raw.toLowerCase())
}
