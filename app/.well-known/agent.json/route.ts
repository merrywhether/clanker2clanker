import { agentCardResponse, WELL_KNOWN_PATHS } from '@/lib/well-known'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return agentCardResponse(request, WELL_KNOWN_PATHS[1])
}
