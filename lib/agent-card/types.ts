/**
 * A2A Agent Card, v1.0.0.
 *
 * v1.0.0 folded the top-level `url`, `preferredTransport`, `additionalInterfaces`, and
 * `protocolVersion` into `supportedInterfaces`, and moved `supportsAuthenticatedExtendedCard`
 * into `capabilities.extendedAgentCard`. Cards mixing the two generations parse under whichever
 * branch a reader tries first, so nothing here emits the pre-1.0 fields.
 */
export interface AgentCard {
  name: string
  description: string
  version: string
  supportedInterfaces: AgentInterface[]
  capabilities: AgentCapabilities
  defaultInputModes: string[]
  defaultOutputModes: string[]
  skills: AgentSkill[]
  provider?: AgentProvider
  documentationUrl?: string
  iconUrl?: string
  securitySchemes?: Record<string, AgentSecurityScheme>
  security?: AgentSecurityRequirement[]
  signatures?: AgentCardSignature[]
  [key: string]: unknown
}

export interface AgentInterface {
  url: string
  protocolBinding: ProtocolBinding
  protocolVersion: string
}

export type ProtocolBinding = 'JSONRPC' | 'GRPC' | 'HTTP+JSON'

export interface AgentCapabilities {
  streaming?: boolean
  pushNotifications?: boolean
  stateTransitionHistory?: boolean
  extendedAgentCard?: boolean
  extensions?: AgentExtension[]
  [key: string]: unknown
}

export interface AgentExtension {
  uri: string
  description?: string
  required?: boolean
  params?: Record<string, unknown>
}

export interface AgentSkill {
  id: string
  name: string
  description: string
  tags: string[]
  examples?: string[]
  inputModes?: string[]
  outputModes?: string[]
}

export interface AgentProvider {
  organization: string
  url: string
}

export type AgentSecurityScheme =
  | { type: 'apiKey'; name: string; in: 'query' | 'header' | 'cookie'; description?: string }
  | { type: 'http'; scheme: string; bearerFormat?: string; description?: string }
  | { type: 'oauth2'; flows: Record<string, unknown>; description?: string }
  | { type: 'openIdConnect'; openIdConnectUrl: string; description?: string }
  | { type: 'mutualTLS'; description?: string }

/** Scheme name → required scope names. */
export type AgentSecurityRequirement = Record<string, string[]>

export interface AgentCardSignature {
  protected: string
  signature: string
  header?: Record<string, unknown>
}
