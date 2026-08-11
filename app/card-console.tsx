'use client'

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import {
  AUTO_VERSION,
  CardConfig,
  INTERFACES_RANGE,
  OverridableField,
  SKILLS_RANGE,
  generateAgentCard,
  parseConfig,
  serializeConfig,
} from '@/lib/agent-card'

import { CardJson } from './card-json'

interface CardState {
  json: string
  seed: string
}

/** `children` take the row under the card, inside the console grid. */
export function CardConsole({ children }: { children?: ReactNode }) {
  const [config, setConfig] = useState<CardConfig | null>(null)
  const [card, setCard] = useState<CardState | null>(null)
  const [copied, setCopied] = useState<'card' | 'header' | null>(null)
  // Bumped on every press, including a repeat press. The burst elements are keyed on it, so each
  // one is a fresh node whose animation starts at full brightness instead of being ignored.
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    setConfig(parseConfig(new URLSearchParams(window.location.search)))
  }, [])

  // Round-tripping through the codec is what keeps the page honest: the card below is generated
  // from exactly what the encoded string means, so a value the endpoint would ignore is ignored
  // here too.
  const encoded = useMemo(() => (config ? serializeConfig(config) : ''), [config])
  const effectiveConfig = useMemo(() => parseConfig(new URLSearchParams(encoded)), [encoded])

  const regenerate = useCallback(() => {
    const { card, config: used } = generateAgentCard({
      origin: window.location.origin,
      config: effectiveConfig,
    })
    setCard({ json: JSON.stringify(card, null, 2), seed: used.seed as string })
    setCopied(null)
  }, [effectiveConfig])

  useEffect(regenerate, [regenerate])

  useEffect(() => {
    if (config) {
      window.history.replaceState(null, '', encoded ? `?${encoded}` : window.location.pathname)
    }
  }, [config, encoded])

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(null), 2000)
    return () => clearTimeout(timer)
  }, [copied, burst])

  const copy = async (what: 'card' | 'header', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setBurst((n) => n + 1)
    } catch {
      setCopied(null)
    }
  }

  const update = (patch: Partial<CardConfig>) =>
    setConfig((current) => (current ? { ...current, ...patch } : current))

  const setOverride = (field: OverridableField, value: string) =>
    setConfig((current) =>
      current
        ? { ...current, overrides: { ...current.overrides, [field]: value || undefined } }
        : current
    )

  const versionIgnored = Boolean(config?.overrides.version && !effectiveConfig.overrides.version)
  const headerValue = `Bearer ${encoded}`

  return (
    <div className="console">
      <p className="sr-only" role="status">
        {copied ? 'Copied to the clipboard.' : ''}
      </p>
      {/* The panel clips its own burst, so the wash that reaches the rest of the page is separate. */}
      {copied && <span key={burst} className="flash-page" aria-hidden="true" />}
      <section className="panel edge panel-fill">
        <div className="edge-inner">
          <header className="panel-head">
            <div className="panel-head-main">
              <h2 className="panel-title">Agent card</h2>
              {card && (
                <p className="seed">
                  seed <b>{card.seed}</b>
                  {!config?.seed && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => update({ seed: card.seed })}
                    >
                      pin it
                    </button>
                  )}
                </p>
              )}
            </div>
            {/* Copy sits inboard of Regenerate so its burst has panel to spread into rather than
                the right edge to collide with. */}
            <div className="actions">
              <span className="burst-slot">
                <button
                  type="button"
                  className={copied === 'card' ? 'btn btn-primary btn-copied' : 'btn btn-primary'}
                  onClick={() => card && copy('card', card.json)}
                  disabled={!card}
                >
                  Copy
                </button>
                {copied === 'card' && <span key={burst} className="burst" aria-hidden="true" />}
              </span>
              <button type="button" className="btn" onClick={regenerate}>
                Regenerate
              </button>
            </div>
          </header>
          <div className="panel-body panel-body-fill">
            <pre className="card-json">
              {card ? <CardJson json={card.json} /> : <span className="placeholder">Generating…</span>}
            </pre>
          </div>
        </div>
      </section>

      <section className="panel edge panel-options">
        <div className="edge-inner">
          <header className="panel-head">
            <h2 className="panel-title">Options</h2>
          </header>
          <div className="panel-body">
            <div className="controls">
              <label className="field">
                <span className="field-label">Seed</span>
                <span className="input-edge">
                  <input
                    type="text"
                    className="input"
                    placeholder="random"
                    value={config?.seed ?? ''}
                    onChange={(e) => update({ seed: e.target.value.trim() || undefined })}
                  />
                </span>
                <span className="field-hint">Pin it to get the same card every time.</span>
              </label>

              <label className="field">
                <span className="field-label">Version</span>
                <span className="input-edge">
                  <input
                    type="text"
                    className="input"
                    placeholder="random"
                    value={config?.overrides.version ?? ''}
                    onChange={(e) => setOverride('version', e.target.value.trim())}
                  />
                </span>
                <span className={versionIgnored ? 'field-hint warn' : 'field-hint'}>
                  {versionIgnored
                    ? 'Ignored — a range or alias is not an exact version.'
                    : `${AUTO_VERSION} stamps the fetch time, so a refresh stacks a new version.`}
                </span>
              </label>

              <label className="field">
                <span className="field-label">Name</span>
                <span className="input-edge">
                  <input
                    type="text"
                    className="input"
                    placeholder="random"
                    value={config?.overrides.name ?? ''}
                    onChange={(e) => setOverride('name', e.target.value)}
                  />
                </span>
                <span className="field-hint">Also description, documentationUrl, iconUrl.</span>
              </label>

              <label className="field field-narrow">
                <span className="field-label">Skills</span>
                <span className="input-edge">
                  <input
                    type="number"
                    className="input"
                    placeholder="random"
                    min={SKILLS_RANGE[0]}
                    max={SKILLS_RANGE[1]}
                    value={config?.skills ?? ''}
                    onChange={(e) => update({ skills: toCount(e.target.value) })}
                  />
                </span>
              </label>

              <label className="field field-narrow">
                <span className="field-label">Interfaces</span>
                <span className="input-edge">
                  <input
                    type="number"
                    className="input"
                    placeholder="random"
                    min={INTERFACES_RANGE[0]}
                    max={INTERFACES_RANGE[1]}
                    value={config?.interfaces ?? ''}
                    onChange={(e) => update({ interfaces: toCount(e.target.value) })}
                  />
                </span>
              </label>

              <div className="field field-toggles">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config?.extras ?? false}
                    onChange={(e) => update({ extras: e.target.checked })}
                  />
                  <span>Vendor extras</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config?.legacy ?? false}
                    onChange={(e) => update({ legacy: e.target.checked })}
                  />
                  <span>Pre-1.0 path only</span>
                </label>
              </div>
            </div>

            <div className="header-box">
              <span className="field-label">Send the same options to the well-known route</span>
              {encoded ? (
                <div className="header-row">
                  <code className="header-value">Authorization: {headerValue}</code>
                  <span className="burst-slot">
                    <button
                      type="button"
                      className={copied === 'header' ? 'btn btn-copied' : 'btn'}
                      onClick={() => copy('header', headerValue)}
                    >
                      Copy
                    </button>
                    {copied === 'header' && (
                      <span key={burst} className="burst" aria-hidden="true" />
                    )}
                  </span>
                </div>
              ) : (
                <p className="field-hint">
                  Nothing set — the defaults need no header. Change an option above and one appears.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {children}
    </div>
  )
}

function toCount(raw: string): number | undefined {
  const value = Number(raw)
  return raw && Number.isInteger(value) ? value : undefined
}
