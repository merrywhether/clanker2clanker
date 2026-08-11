import { createRng, randomSeed } from './rng'
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
  SKILLS,
} from './vocabulary'

export interface GenerateOptions {
  /** Origin the card advertises its own interfaces on, e.g. `https://clanker2clanker.example`. */
  origin: string
  /** Omit for a fresh card; pass a previous seed to reproduce one. */
  seed?: string
}

export interface GeneratedCard {
  card: AgentCard
  seed: string
}

/**
 * Caps the card well under the response-size limits registries impose while fetching it, and
 * keeps the rendered card readable on the page.
 */
const MAX_SKILLS = 5

const PROTOCOL_BINDINGS: ProtocolBinding[] = ['JSONRPC', 'GRPC', 'HTTP+JSON']

export function generateAgentCard({ origin, seed = randomSeed() }: GenerateOptions): GeneratedCard {
  const rng = createRng(seed)

  const name = [
    rng.pick(NAME_PREFIXES),
    rng.pick(NAME_SUBJECTS),
    ...(rng.chance(0.4) ? [rng.pick(NAME_SUFFIXES)] : []),
  ].join(' ')

  const card: AgentCard = {
    name,
    description: `${rng.pick(DESCRIPTION_VERBS)} ${rng.pick(DOMAINS)} ${rng.pick(DESCRIPTION_TAILS)}`,
    version: generateVersion(rng),
    supportedInterfaces: generateInterfaces(rng, origin),
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
    skills: generateSkills(rng),
  }

  const organization = rng.pick(ORGANIZATIONS)
  card.provider = { organization, url: `https://${slugify(organization)}.example` }

  if (rng.chance(0.75)) {
    card.documentationUrl = `https://${slugify(organization)}.example/docs/${slugify(name)}`
  }
  if (rng.chance(0.5)) {
    card.iconUrl = `https://${slugify(organization)}.example/icons/${slugify(name)}.png`
  }

  if (rng.chance(0.7)) {
    const [schemes, requirements] = generateSecurity(rng)
    card.securitySchemes = schemes
    card.security = requirements
  }

  if (rng.chance(0.25)) {
    card.signatures = [generateSignature(rng)]
  }

  return { card, seed }
}

/**
 * Exact semver only. Ranges and aliases (`^1.2`, `>=2`, `1.x`, `latest`) are legal-looking version
 * strings that registries reject, and a generated card is worthless if it cannot be imported.
 */
function generateVersion(rng: ReturnType<typeof createRng>): string {
  return `${rng.int(0, 4)}.${rng.int(0, 12)}.${rng.int(0, 9)}`
}

function generateInterfaces(rng: ReturnType<typeof createRng>, origin: string): AgentInterface[] {
  const bindings = rng.sample(PROTOCOL_BINDINGS, rng.int(1, 3))
  return bindings.map((protocolBinding) => ({
    url: `${origin}/a2a/${protocolBinding.toLowerCase().replace('+', '-')}`,
    protocolBinding,
    protocolVersion: '1.0.0',
  }))
}

function generateSkills(rng: ReturnType<typeof createRng>): AgentSkill[] {
  return rng.sample(SKILLS, rng.int(1, MAX_SKILLS)).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    tags: template.tags,
    ...(rng.chance(0.7) && { examples: template.examples }),
    ...(rng.chance(0.4) && { inputModes: rng.sample(MIME_TYPES, rng.int(1, 2)) }),
    ...(rng.chance(0.4) && { outputModes: rng.sample(MIME_TYPES, 1) }),
  }))
}

function generateSecurity(
  rng: ReturnType<typeof createRng>
): [Record<string, AgentSecurityScheme>, AgentSecurityRequirement[]] {
  const candidates: [string, AgentSecurityScheme, string[]][] = [
    ['bearer', { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, []],
    ['apiKey', { type: 'apiKey', name: 'X-Api-Key', in: 'header' }, []],
    [
      'oidc',
      { type: 'openIdConnect', openIdConnectUrl: 'https://id.example/.well-known/openid-configuration' },
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
function generateSignature(rng: ReturnType<typeof createRng>): AgentCardSignature {
  return {
    protected: base64url(rng, 48),
    signature: base64url(rng, 86),
    header: { kid: `key-${rng.int(1000, 9999)}` },
  }
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function base64url(rng: ReturnType<typeof createRng>, length: number): string {
  return Array.from({ length }, () => rng.pick([...BASE64URL_ALPHABET])).join('')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
