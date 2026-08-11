import { agentCardResponse } from '@/lib/well-known'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return agentCardResponse(request)
}
