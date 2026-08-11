import type { MetadataRoute } from 'next'

/**
 * Slack, Twitter and Facebook all check robots.txt before unfurling, so a blanket disallow
 * suppresses link previews as well as search engines. Crawling is allowed and the pages carry
 * `noindex` instead, which keeps the site out of results while letting a preview render.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
  }
}
