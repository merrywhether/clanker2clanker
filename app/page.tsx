import { CardConsole } from './card-console'
import { WELL_KNOWN_PATHS } from '@/lib/well-known'

const [PRIMARY_PATH, LEGACY_PATH] = WELL_KNOWN_PATHS

/** Pinned to the version the generator emits, not `latest`, which will move off it. */
const SPEC_URL = 'https://a2a-protocol.org/v1.0.0/specification/#8-agent-discovery-the-agent-card'

export default function Home() {
  return (
    <main>
      <header className="masthead">
        <h1 className="wordmark">
          clanker<span className="split">2</span>clanker
        </h1>
        <p className="tagline">
          An agent that exists only on paper. Generates a random{' '}
          <a href={SPEC_URL} target="_blank" rel="noreferrer">
            A2A v1.0.0 agent card
          </a>
          , so you can test whatever consumes them without inventing one by hand.
        </p>
      </header>

      <CardConsole>
        <section className="panel edge panel-fetch">
          <div className="edge-inner">
            <header className="panel-head">
              <div className="panel-head-main">
                <h2 className="panel-title">Fetch it instead</h2>
                <p className="prose">
                  Point your service at either route on this domain and it discovers an agent that
                  is not there.
                </p>
              </div>
            </header>
            <div className="panel-body">
              <ul className="path-list">
                <li>
                  <a href={PRIMARY_PATH}>{PRIMARY_PATH}</a>
                </li>
                <li>
                  <a href={LEGACY_PATH}>{LEGACY_PATH}</a>{' '}
                  <span className="path-note">— the pre-1.0 location, same card</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </CardConsole>

      <footer>Nothing here is real. Do not deploy it, do not pay it, do not trust it.</footer>
    </main>
  )
}
