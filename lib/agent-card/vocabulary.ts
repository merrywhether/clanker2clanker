/** Word banks the generator draws from. Everything here is deliberately fictional. */

export const NAME_PREFIXES = [
  'Neon',
  'Vector',
  'Quantum',
  'Chrome',
  'Halcyon',
  'Obsidian',
  'Lumen',
  'Cinder',
  'Meridian',
  'Cobalt',
  'Vesper',
  'Arclight',
  'Nimbus',
  'Onyx',
  'Solstice',
  'Tessellate',
] as const

export const NAME_SUBJECTS = [
  'Ledger',
  'Atlas',
  'Courier',
  'Sentinel',
  'Broker',
  'Archivist',
  'Cartographer',
  'Herald',
  'Steward',
  'Oracle',
  'Warden',
  'Scribe',
  'Quartermaster',
  'Navigator',
  'Auditor',
  'Concierge',
] as const

export const NAME_SUFFIXES = ['Agent', 'Service', 'Unit', 'Node', 'Works', 'Collective'] as const

export const DOMAINS = [
  'freight logistics',
  'clinical intake',
  'municipal permitting',
  'supply-chain forecasting',
  'incident triage',
  'contract review',
  'field-service dispatch',
  'grant administration',
  'inventory reconciliation',
  'fraud review',
  'curriculum planning',
  'habitat monitoring',
] as const

export const DESCRIPTION_VERBS = [
  'Coordinates',
  'Negotiates',
  'Summarizes',
  'Reconciles',
  'Routes',
  'Audits',
  'Drafts',
  'Monitors',
] as const

export const DESCRIPTION_TAILS = [
  'and hands the result back as structured JSON.',
  'across a fleet of downstream tools.',
  'without ever touching production data.',
  'on behalf of a human operator who signs off at the end.',
  'and escalates anything it cannot resolve on its own.',
  'in a single conversational turn.',
] as const

export const ORGANIZATIONS = [
  'Halcyon Systems',
  'Tessera Labs',
  'Groundloop Industries',
  'Meridian Data Union',
  'Cold Harbour Robotics',
  'Ninth Street Automata',
  'Pale Horse Analytics',
  'Verdant Machine Works',
] as const

export interface SkillTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  examples: string[]
}

export const SKILLS: SkillTemplate[] = [
  {
    id: 'summarize-thread',
    name: 'Summarize thread',
    description: 'Condenses a long message thread into a short brief with open questions called out.',
    tags: ['summarization', 'text'],
    examples: ['Summarize the last 40 messages in this thread.'],
  },
  {
    id: 'reconcile-ledger',
    name: 'Reconcile ledger',
    description: 'Matches transactions across two ledgers and reports the entries that do not line up.',
    tags: ['finance', 'reconciliation'],
    examples: ['Reconcile the September ledger against the bank export.'],
  },
  {
    id: 'triage-incident',
    name: 'Triage incident',
    description: 'Classifies an incoming incident by severity and routes it to the right on-call rotation.',
    tags: ['operations', 'routing'],
    examples: ['Triage the alert that just fired on the checkout service.'],
  },
  {
    id: 'draft-response',
    name: 'Draft response',
    description: 'Drafts a reply in the requested tone and leaves it unsent for a human to approve.',
    tags: ['writing', 'drafting'],
    examples: ['Draft a polite decline to this vendor proposal.'],
  },
  {
    id: 'extract-entities',
    name: 'Extract entities',
    description: 'Pulls names, dates, amounts, and identifiers out of unstructured text.',
    tags: ['extraction', 'nlp'],
    examples: ['Extract every party and effective date from this contract.'],
  },
  {
    id: 'plan-route',
    name: 'Plan route',
    description: 'Builds a delivery route across a set of stops under time-window constraints.',
    tags: ['logistics', 'planning'],
    examples: ['Plan tomorrow morning route for the north depot.'],
  },
  {
    id: 'check-compliance',
    name: 'Check compliance',
    description: 'Checks a document against a named policy and lists each clause that fails.',
    tags: ['compliance', 'review'],
    examples: ['Check this statement of work against the standard retention policy.'],
  },
  {
    id: 'forecast-demand',
    name: 'Forecast demand',
    description: 'Projects demand for the next few periods from a supplied history.',
    tags: ['forecasting', 'analytics'],
    examples: ['Forecast demand for SKU 4471 through the end of the quarter.'],
  },
  {
    id: 'translate-document',
    name: 'Translate document',
    description: 'Translates a document while preserving its headings, tables, and footnotes.',
    tags: ['translation', 'text'],
    examples: ['Translate this onboarding packet into Portuguese.'],
  },
  {
    id: 'schedule-visit',
    name: 'Schedule visit',
    description: 'Finds a slot that satisfies every attendee and holds it pending confirmation.',
    tags: ['scheduling', 'calendar'],
    examples: ['Schedule the site visit sometime next week.'],
  },
]

export const MIME_TYPES = [
  'text/plain',
  'application/json',
  'text/markdown',
  'application/pdf',
  'image/png',
] as const

export const EXTENSION_URIS = [
  'https://a2a.example/extensions/long-running-tasks/v1',
  'https://a2a.example/extensions/structured-output/v1',
  'https://a2a.example/extensions/human-review/v1',
] as const
