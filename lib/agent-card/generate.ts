import { CardConfig, EMPTY_CONFIG, resolveVersion } from './config'
import { createRng, randomSeed, Rng } from './rng'
import type {
  AgentCard,
  AgentCardSignature,
  AgentInterface,
  AgentSecurityRequirement,
  AgentSecurityScheme,
  AgentSkill,
  ProtocolBinding,
} from './types'
import {
  DESCRIPTION_TAILS,
  DESCRIPTION_VERBS,
  DOMAINS,
  EXTENSION_URIS,
  MIME_TYPES,
  NAME_PREFIXES,
  NAME_SUBJECTS,
  NAME_SUFFIXES,
  ORGANIZATIONS,
  RESOURCE_NAMES,
  SKILLS,
} from './vocabulary'

export interface GenerateOptions {
  /** Origin the card advertises its own interfaces on, e.g. `https://clanker2clanker.example`. */
  origin: string
  config?: CardConfig
  /** Supplied by the caller so a card is a pure function of its inputs. */
  now?: Date
}

export interface GeneratedCard {
  card: AgentCard
  /** The config that produced this card, with the seed filled in. */
  config: CardConfig
}

/** How many skills a card gets when the count is left to chance. */
const DEFAULT_MAX_SKILLS = 5

const PROTOCOL_BINDINGS: ProtocolBinding[] = ['JSONRPC', 'GRPC', 'HTTP+JSON']

export function generateAgentCard({
  origin,
  config = EMPTY_CONFIG,
  now = new Date(),
}: GenerateOptions): GeneratedCard {
  const seed = config.seed ?? randomSeed()
  const rng = createRng(seed)
  const { overrides } = config

  const name =
    overrides.name ??
    [
      rng.pick(NAME_PREFIXES),
      rng.pick(NAME_SUBJECTS),
      ...(rng.chance(0.4) ? [rng.pick(NAME_SUFFIXES)] : []),
    ].join(' ')

  const card: AgentCard = {
    name,
    description:
      overrides.description ??
      `${rng.pick(DESCRIPTION_VERBS)} ${rng.pick(DOMAINS)} ${rng.pick(DESCRIPTION_TAILS)}`,
    version: resolveVersion(generateVersion(rng), overrides.version, now),
    supportedInterfaces: generateInterfaces(rng, origin, config.interfaces),
    capabilities: {
      streaming: rng.chance(0.7),
      pushNotifications: rng.chance(0.4),
      stateTransitionHistory: rng.chance(0.3),
      extendedAgentCard: rng.chance(0.2),
      ...(rng.chance(0.35) && {
        extensions: rng.sample(EXTENSION_URIS, rng.int(1, 2)).map((uri) => ({
          uri,
          required: rng.chance(0.3),
        })),
      }),
    },
    defaultInputModes: rng.sample(MIME_TYPES, rng.int(1, 3)),
    defaultOutputModes: rng.sample(MIME_TYPES, rng.int(1, 2)),
    skills: generateSkills(rng, config),
  }

  const organization = rng.pick(ORGANIZATIONS)
  card.provider = { organization, url: `https://${slugify(organization)}.example` }

  const documentationUrl =
    overrides.documentationUrl ??
    (rng.chance(0.75) ? `https://${slugify(organization)}.example/docs/${slugify(name)}` : undefined)
  if (documentationUrl) {
    card.documentationUrl = documentationUrl
  }

  const iconUrl =
    overrides.iconUrl ??
    (rng.chance(0.5)
      ? `https://${slugify(organization)}.example/icons/${slugify(name)}.png`
      : undefined)
  if (iconUrl) {
    card.iconUrl = iconUrl
  }

  if (rng.chance(0.7)) {
    const [schemes, requirements] = generateSecurity(rng)
    card.securitySchemes = schemes
    card.security = requirements
  }

  if (rng.chance(0.25)) {
    card.signatures = [generateSignature(rng)]
  }

  if (config.extras) {
    addVendorExtras(rng, card)
  }

  return { card, config: { ...config, seed } }
}

/**
 * Exact semver only. Ranges and aliases (`^1.2`, `>=2`, `1.x`, `latest`) are legal-looking version
 * strings that registries reject, and a generated card is worthless if it cannot be imported.
 */
function generateVersion(rng: Rng): string {
  return `${rng.int(0, 4)}.${rng.int(0, 12)}.${rng.int(0, 9)}`
}

function generateInterfaces(rng: Rng, origin: string, count?: number): AgentInterface[] {
  const bindings = rng.sample(PROTOCOL_BINDINGS, count ?? rng.int(1, PROTOCOL_BINDINGS.length))
  return bindings.map((protocolBinding) => ({
    url: `${origin}/a2a/${protocolBinding.toLowerCase().replace('+', '-')}`,
    protocolBinding,
    protocolVersion: '1.0.0',
  }))
}

function generateSkills(rng: Rng, config: CardConfig): AgentSkill[] {
  const count = config.skills ?? rng.int(1, DEFAULT_MAX_SKILLS)
  return rng.sample(SKILLS, count).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    tags: template.tags,
    ...(rng.chance(0.7) && { examples: template.examples }),
    ...(rng.chance(0.4) && { inputModes: rng.sample(MIME_TYPES, rng.int(1, 2)) }),
    ...(rng.chance(0.4) && { outputModes: rng.sample(MIME_TYPES, 1) }),
  }))
}

/**
 * Keys outside the A2A schema, of the kind cards carry in the wild — a top-level collection, a
 * capability flag that is not in the spec, and a per-skill annotation.
 */
function addVendorExtras(rng: Rng, card: AgentCard): void {
  card.resources = rng.sample(RESOURCE_NAMES, rng.int(1, 3)).map((name) => ({
    name,
    uri: `resource://${slugify(name)}`,
    mimeType: 'application/json',
  }))
  card.capabilities.multiTurn = rng.chance(0.8)
  for (const skill of card.skills) {
    Object.assign(skill, { costUsd: Number((rng.int(1, 250) / 1000).toFixed(3)) })
  }
}

function generateSecurity(
  rng: Rng
): [Record<string, AgentSecurityScheme>, AgentSecurityRequirement[]] {
  const candidates: [string, AgentSecurityScheme, string[]][] = [
    ['bearer', { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, []],
    ['apiKey', { type: 'apiKey', name: 'X-Api-Key', in: 'header' }, []],
    [
      'oidc',
      {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://id.example/.well-known/openid-configuration',
      },
      ['agent.invoke', 'agent.read'],
    ],
    [
      'oauth2',
      {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://id.example/oauth2/token',
            scopes: { 'agent.invoke': 'Invoke the agent' },
          },
        },
      },
      ['agent.invoke'],
    ],
    ['mtls', { type: 'mutualTLS' }, []],
  ]

  const chosen = rng.sample(candidates, rng.int(1, 2))
  const schemes = Object.fromEntries(chosen.map(([key, scheme]) => [key, scheme]))
  const requirements = chosen.map(([key, , scopes]) => ({ [key]: scopes }))
  return [schemes, requirements]
}

/** Structurally a JWS over the card, but the bytes are noise — nothing verifies against a key. */
function generateSignature(rng: Rng): AgentCardSignature {
  return {
    protected: base64url(rng, 48),
    signature: base64url(rng, 86),
    header: { kid: `key-${rng.int(1000, 9999)}` },
  }
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function base64url(rng: Rng, length: number): string {
  return Array.from({ length }, () => rng.pick([...BASE64URL_ALPHABET])).join('')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
