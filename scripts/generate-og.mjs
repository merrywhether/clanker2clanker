/**
 * Renders public/og.png, the link-preview image. Run `npm run og` after changing the masthead.
 *
 * Deliberately outside the Next build: the image changes about never, so there is no reason to pay
 * for it on every deploy, and owning the renderer is what lets it use the same font as the site.
 * Satori reads woff but not woff2, which is why these point at the .woff files.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const WIDTH = 1200
const HEIGHT = 630
const CYAN = '#22e8ff'
const MAGENTA = '#ff2bd6'
const MUTED = '#6b8798'
const RULE = 'rgba(34, 232, 255, 0.07)'
const FONT = 'JetBrains Mono'

const el = (style, children) => ({ type: 'div', props: { style, children } })

const glow = (color) => `0 0 26px ${color}, 0 0 70px ${color}`

/** Satori supports neither clip-path nor repeating gradients, so no cut corners and a drawn grid. */
function gridLines() {
  const lines = []
  for (let x = 0; x < WIDTH; x += 68) {
    lines.push(el({ position: 'absolute', top: 0, left: x, width: 1, height: HEIGHT, background: RULE }))
  }
  for (let y = 0; y < HEIGHT; y += 68) {
    lines.push(el({ position: 'absolute', top: y, left: 0, width: WIDTH, height: 1, background: RULE }))
  }
  return el({ position: 'absolute', top: 0, left: 0, width: WIDTH, height: HEIGHT, display: 'flex' }, lines)
}

const wordmark = el(
  { display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: '-0.03em' },
  [
    el({ color: '#fff', textShadow: glow('rgba(34, 232, 255, 0.85)') }, 'clanker'),
    el({ color: MAGENTA, textShadow: glow('rgba(255, 43, 214, 0.85)') }, '2'),
    el({ color: '#fff', textShadow: glow('rgba(34, 232, 255, 0.85)') }, 'clanker'),
  ]
)

const card = el(
  {
    width: WIDTH,
    height: HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 96px',
    fontFamily: FONT,
    background: '#04060a',
    backgroundImage: [
      'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(34, 232, 255, 0.30), transparent 70%)',
      'radial-gradient(ellipse 55% 55% at 92% 112%, rgba(255, 43, 214, 0.28), transparent 70%)',
    ].join(','),
  },
  [
    gridLines(),
    wordmark,
    el({
      width: 640,
      height: 2,
      marginTop: 36,
      background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA} 60%, transparent)`,
    }),
    el({ marginTop: 32, fontSize: 28, color: MUTED }, 'An agent that exists only on paper.'),
    el({ marginTop: 10, fontSize: 28, color: CYAN }, 'Randomly generated A2A v1.0.0 agent cards.'),
  ]
)

const file = (weight) =>
  require.resolve(`@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${weight}-normal.woff`)

const svg = await satori(card, {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: FONT, data: await readFile(file(400)), weight: 400, style: 'normal' },
    { name: FONT, data: await readFile(file(700)), weight: 700, style: 'normal' },
  ],
})

const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()

await mkdir(join(root, 'public'), { recursive: true })
await writeFile(join(root, 'public/og.png'), png)

console.log(`public/og.png — ${WIDTH}x${HEIGHT}, ${(png.length / 1024).toFixed(1)} KB`)
