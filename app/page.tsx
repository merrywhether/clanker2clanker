import { CardConsole } from './card-console'
import { WELL_KNOWN_PATHS } from '@/lib/well-known'

const [PRIMARY_PATH, LEGACY_PATH] = WELL_KNOWN_PATHS

export default function Home() {
  return (
    <>
      <main>
        <header className="masthead">
          <h1 className="wordmark">
            clanker<span className="split">2</span>clanker
          </h1>
          <p className="tagline">
            An agent that exists only on paper. Generates a random A2A v1.0.0 agent card, so you can
            test whatever consumes them without inventing one by hand.
          </p>
          <div className="rule" />
        </header>

        <CardConsole />

        <section className="panel edge">
          <div className="edge-inner">
            <header className="panel-head">
              <h2 className="panel-title">Fetch it instead</h2>
            </header>
            <div className="panel-body">
              <p className="prose">
                Point your service at the well-known route on this domain and it will discover an
                agent that is not there. Every request returns a different card.
              </p>
              <ul className="path-list">
                <li>
                  <a href={PRIMARY_PATH}>{PRIMARY_PATH}</a>
                </li>
                <li>
                  <a href={LEGACY_PATH}>{LEGACY_PATH}</a>{' '}
                  <span className="path-note">— same card, at the pre-1.0 location</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <footer>Nothing here is real. Do not deploy it, do not pay it, do not trust it.</footer>
    </>
  )
}
