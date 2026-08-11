# clanker2clanker

An agent that exists only on paper.

It generates random [A2A](https://a2a-protocol.org/) v1.0.0 agent cards — on a page you can copy
from, and at the well-known URI so anything that discovers agents over HTTP can discover this one.
Useful when you are building something that consumes agent cards and are tired of hand-editing the
same saved JSON file.

## Routes

| Route | What it does |
|---|---|
| `/` | Landing page. Generates a card in the browser, with copy and regenerate. |
| `/.well-known/agent-card.json` | A freshly generated card. |
| `/.well-known/agent.json` | The same, at the pre-1.0 location. |

Both well-known routes answer `200` with `application/json` and `Cache-Control: no-store`, and every
request returns a different card. The seed that produced a card comes back in the `X-Card-Seed`
response header.

## What the generator guarantees

The cards are random, but they are always importable. Every card:

- carries a non-empty `name`, `description`, and `version`
- uses an **exact** semver `version` — never a range or an alias like `^1.2` or `latest`, which
  registries reject
- is a JSON object, a few KB at most, with at least one skill and one supported interface
- uses the v1.0.0 interface shape (`supportedInterfaces`), with none of the pre-1.0 top-level `url`,
  `preferredTransport`, `additionalInterfaces`, or `protocolVersion` fields mixed in

The `supportedInterfaces[].url` values point back at whatever origin served the card.

Nothing on the other end of those URLs answers. This is a card, not an agent.

## Development

```sh
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

The generator in `lib/agent-card/` is plain TypeScript with no framework imports, and runs unchanged
in the browser and on the server.

## Deploying

Hosted on [Volcano](https://volcano.dev). Deploys happen on push to `main` through the connected
repository; `npx @volcano.dev/cli cloud frontends deploy` does the same thing by hand.

## Roadmap

- Generation knobs: a seed for repeatability, skill and interface counts, optional extra
  non-spec attributes
- Cards targeting the older A2A versions at `/.well-known/agent.json`
- The same knobs over an `Authorization` header, for callers that can only reach the well-known URI
