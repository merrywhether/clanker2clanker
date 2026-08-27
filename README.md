# clanker2clanker

An agent that exists only on paper.

It generates random [A2A](https://a2a-protocol.org/) v1.0.0 agent cards — on a page you can copy
from, and at the well-known URI so anything that discovers agents over HTTP can discover this one.
Useful when you are building something that consumes agent cards and are tired of hand-editing the
same saved JSON file.

## Routes

| Route | What it does |
|---|---|
| `/` | Landing page. Generates a card in the browser, with copy, regenerate, and the options below. |
| `/.well-known/agent-card.json` | A freshly generated card. |
| `/.well-known/agent.json` | The same, at the pre-1.0 location. |
| `/llms.txt` | Everything below, for whatever arrives without a human attached. |

Both well-known routes answer `200` with `application/json` and `Cache-Control: no-store`, and every
request returns a different card. The seed that produced a card comes back in the `X-Card-Config`
response header, along with any other options that were applied.

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
| `status`, `redirect`, `malformed`, `delay` | Make the fetch fail. See below. |

`seed` and `version` combine into four useful behaviors: a seed alone repeats one card exactly,
`seed` + `version=auto` holds the card still while its version climbs, no seed at all changes
everything each request, and a literal version pins whatever you need pinned.

An option that would produce an unimportable card — a version range, say — is ignored rather than
rejected, so the endpoint always answers with a usable card. The `X-Card-Config` response header
echoes what was actually applied.

## Making it fail

A reader that fetches an agent card has more than one way to not get one, and most of them are
awkward to reach on purpose — a bogus hostname only ever produces the same one. These options make
the well-known routes fail on request, in the same encoded string as everything else.

| Option | Effect |
|---|---|
| `status` | Answer with this code instead of `200`. `300`–`599`. A `401` also sends `WWW-Authenticate`, though the CDN in front of the deployed site strips it. |
| `redirect` | Answer with a redirect to this location, absolute or rooted. `302` unless `status` names another `3xx`. |
| `malformed` | Answer `200` with something that is not a usable card. |
| `delay` | Hold the response open this many milliseconds first, up to `8000`. |

```sh
curl -H 'Authorization: Bearer status=403' https://…/.well-known/agent-card.json
curl -H 'Authorization: Bearer redirect=https://elsewhere.example/agent-card.json&status=308' …
curl -H 'Authorization: Bearer malformed=huge' …
curl -H 'Authorization: Bearer delay=6000' …
```

`malformed` takes the kind of broken you want. A bare `malformed` means `shape`.

| Kind | Body |
|---|---|
| `shape` | Valid JSON, with the card buried in an envelope and nothing a reader validates at the top level. |
| `syntax` | The card's own JSON, cut off mid-structure, so it does not parse. |
| `html` | An HTML page, served at `200` — what a host returns when it has no idea what the path is. |
| `huge` | A card padded past any sane size limit. |

They compose: `status=503&malformed=html` is a `503` with an HTML body, and `delay` applies to
whatever the response turns out to be. Values out of range are dropped rather than clamped, since a
clamped status is a different test than the one you asked for.

Every malformed body is derived from the card the seed produced, so a failing response reproduces
byte for byte exactly as a good one does. `X-Card-Config` still echoes what was applied.

## What the generator guarantees

None of the above touches the generator: the failure options decide what the route does with a
card, not what a card is. The cards are random, but they are always importable. Every card:

- carries a non-empty `name`, `description`, and `version`
- uses an **exact** semver `version` — never a range or an alias like `^1.2` or `latest`, which
  registries reject
- is a JSON object, a few KB at most, with at least one skill and one supported interface
- uses the v1.0.0 interface shape (`supportedInterfaces`), with none of the pre-1.0 top-level `url`,
  `preferredTransport`, `additionalInterfaces`, or `protocolVersion` fields mixed in

The `supportedInterfaces[].url` values point back at whatever origin served the card.

Nothing on the other end of those URLs answers. This is a card, not an agent.

## llms.txt

`/llms.txt` documents the whole option grammar on the site itself, which is otherwise only spelled
out here and in the page's controls. It is generated from the codec's own constants — the ranges,
the malformed kinds, the well-known paths — rather than written out, so it cannot drift from the
parser, and the examples name the host the reader actually reached.

## Development

```sh
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

The generator in `lib/agent-card/` is plain TypeScript with no framework imports, and runs unchanged
in the browser and on the server.

`npm run images` regenerates `public/og.png` (the link preview) and `app/icon.png` (the favicon).
Both are committed, so this only needs running when the masthead changes.

**`SITE_URL` is required for a production build.** A link preview needs an absolute image URL, and
the page is prerendered, so the origin has to be known at build time. Set it to the public origin
the site is served from, with no trailing slash. `next dev` falls back to `http://localhost:3000`;
`next build` fails without it rather than shipping previews that point somewhere useless.

## Deploying

Hosted on [Volcano](https://volcano.dev), deployed from a working copy:

```sh
volcano login
volcano use clanker2clanker
volcano cloud frontends deploy --name clanker2clanker --path .
```

## Roadmap

- Cards targeting the older A2A versions at `/.well-known/agent.json`
