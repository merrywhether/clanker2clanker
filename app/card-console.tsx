'use client'

import { useCallback, useEffect, useState } from 'react'

import { generateAgentCard } from '@/lib/agent-card'

interface CardState {
  json: string
  seed: string
}

export function CardConsole() {
  const [card, setCard] = useState<CardState | null>(null)
  const [copied, setCopied] = useState(false)

  // Generated after mount rather than rendered on the server: the page is static, and the card
  // depends on the origin the visitor actually loaded it from.
  const regenerate = useCallback(() => {
    const { card, seed } = generateAgentCard({ origin: window.location.origin })
    setCard({ json: JSON.stringify(card, null, 2), seed })
    setCopied(false)
  }, [])

  useEffect(regenerate, [regenerate])

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (!card) {
      return
    }
    try {
      await navigator.clipboard.writeText(card.json)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="panel edge">
      <div className="edge-inner">
        <header className="panel-head">
          <h2 className="panel-title">Agent card</h2>
          <div className="actions">
            <button type="button" className="btn" onClick={regenerate}>
              Regenerate
            </button>
            <button type="button" className="btn btn-primary" onClick={copy} disabled={!card}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </header>
        <div className="panel-body">
          <pre className="card-json">
            {card ? card.json : <span className="placeholder">Generating…</span>}
          </pre>
          {card && (
            <p className="seed">
              seed <b>{card.seed}</b>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
