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

## Options

The landing page keeps its options in the query string, and the well-known routes read the same
encoded string from the `Authorization` header — so the controls on the page produce the header you
need, and the two can't drift apart.

```sh
curl -H 'Authorization: Bearer seed=234&version=auto&skills=3' https://…/.well-known/agent-card.json
curl 'https://…/.well-known/agent-card.json?seed=234&version=auto&skills=3'
```

| Option | Effect |
|---|---|
| `seed` | Reproduces a card exactly. Omit it for a new one every request. |
| `version` | `auto` stamps the fetch time into the patch segment; anything else is used verbatim. |
| `name`, `description`, `documentationUrl`, `iconUrl` | Set outright. |
| `skills`, `interfaces` | Fix the counts instead of leaving them to chance. |
| `extras` | Add the non-spec vendor keys real cards carry. |
| `legacy` | Publish only at the pre-1.0 path, so the primary one 404s. |

`seed` and `version` combine into four useful behaviors: a seed alone repeats one card exactly,
`seed` + `version=auto` holds the card still while its version climbs, no seed at all changes
everything each request, and a literal version pins whatever you need pinned.

An option that would produce an unimportable card — a version range, say — is ignored rather than
rejected, so the endpoint always answers with a usable card. The `X-Card-Config` response header
echoes what was actually applied.

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

Hosted on [Volcano](https://volcano.dev), deployed from a working copy:

```sh
volcano login
volcano use clanker2clanker
volcano cloud frontends deploy --name clanker2clanker --path .
```

## Roadmap

- Cards targeting the older A2A versions at `/.well-known/agent.json`
