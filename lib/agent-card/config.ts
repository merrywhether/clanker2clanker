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

/** `version=auto` stamps the fetch time into the patch segment. */
export const AUTO_VERSION = 'auto'

export const SKILLS_RANGE = [1, 10] as const
export const INTERFACES_RANGE = [1, 3] as const

/** Matches version strings that name a range or an alias rather than one exact version. */
const VERSION_RANGE = /^[\^~]|^[><=]|\s-\s|[xX*]|^latest$/

const VERSION_MAX_LENGTH = 256

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
