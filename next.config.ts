import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next writes its own AGENTS.md and CLAUDE.md into the repo root on dev. Agent orientation for
  // this repo lives in the git-ignored .llms/ tree, so these would be untracked noise at best and
  // a second, silently-regenerated source of truth at worst.
  agentRules: false,
}

export default nextConfig
