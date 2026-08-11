import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Self-hosted, so the wordmark is the same shape for everyone. The system mono stack it used to
// ride on resolves to a different face per platform, and to none of them in the preview image.
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '@fontsource/jetbrains-mono/latin-700.css'

import './globals.css'

const TITLE = 'clanker2clanker'
const DESCRIPTION = 'Randomly generated A2A agent cards, on a page and at the well-known URI.'

/** Prerendered by `npm run og`, not by the build. */
const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'clanker2clanker — randomly generated A2A agent cards',
}

/**
 * A link preview needs an absolute image URL, so the origin has to be known when this page is
 * prerendered. It is not in the repo — `SITE_URL` is a project variable — and a silent fallback
 * would ship previews pointing at localhost, so a production build without it fails here instead.
 */
function siteOrigin(): string {
  const configured = process.env.SITE_URL
  if (configured) {
    return configured
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SITE_URL is unset, so the link preview would point at nothing. See README.')
  }

  return 'http://localhost:3000'
}

const ORIGIN = siteOrigin()

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  // Unfurlers have to be let in for a preview to exist at all, so search engines are turned away
  // here rather than in robots.txt.
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: ORIGIN,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grid-backdrop" aria-hidden="true" />
        <div className="scanlines" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
