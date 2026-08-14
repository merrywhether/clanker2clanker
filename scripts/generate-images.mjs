/**
 * Renders the site's two fixed images — the link preview and the favicon. Run `npm run images`
 * after changing the masthead.
 *
 * Deliberately outside the Next build: they change about never, so there is no reason to pay for
 * them on every deploy, and owning the renderer is what lets them use the same font as the site.
 * Satori reads woff but not woff2, which is why the fonts point at the .woff files.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const VOID = '#04060a'
const CYAN = '#22e8ff'
const MAGENTA = '#ff2bd6'
const MUTED = '#6b8798'
const RULE = 'rgba(34, 232, 255, 0.07)'
const FONT = 'JetBrains Mono'

const el = (style, children) => ({ type: 'div', props: { style, children } })

const glow = (color) => `0 0 26px ${color}, 0 0 70px ${color}`

/** A box that centers one glyph, so the grid cells below can be positioned rather than laid out. */
const glyph = (style, children) =>
  el({ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }, children)

// ── Link preview ────────────────────────────────────────────────────────────────────────────────

const OG = { width: 1200, height: 630 }

/** Satori supports neither clip-path nor repeating gradients, so no cut corners and a drawn grid. */
function gridLines() {
  const lines = []
  for (let x = 0; x < OG.width; x += 68) {
    lines.push(el({ position: 'absolute', top: 0, left: x, width: 1, height: OG.height, background: RULE }))
  }
  for (let y = 0; y < OG.height; y += 68) {
    lines.push(el({ position: 'absolute', top: y, left: 0, width: OG.width, height: 1, background: RULE }))
  }
  return el({ position: 'absolute', top: 0, left: 0, ...OG, display: 'flex' }, lines)
}

const preview = el(
  {
    ...OG,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 96px',
    fontFamily: FONT,
    background: VOID,
    backgroundImage: [
      'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(34, 232, 255, 0.30), transparent 70%)',
      'radial-gradient(ellipse 55% 55% at 92% 112%, rgba(255, 43, 214, 0.28), transparent 70%)',
    ].join(','),
  },
  [
    gridLines(),
    el({ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: '-0.03em' }, [
      el({ color: '#fff', textShadow: glow('rgba(34, 232, 255, 0.85)') }, 'clanker'),
      el({ color: MAGENTA, textShadow: glow('rgba(255, 43, 214, 0.85)') }, '2'),
      el({ color: '#fff', textShadow: glow('rgba(34, 232, 255, 0.85)') }, 'clanker'),
    ]),
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

// ── Favicon ─────────────────────────────────────────────────────────────────────────────────────

const ICON = 512
const CELL = ICON / 2

/**
 * All three measured off this face's outlines rather than assumed. A lowercase c's ink is 0.570em
 * tall and 0.433em wide, and it sits 0.085em below the centre of the line box, because flex centres
 * the line box and an x-height glyph hangs low in it. The digit needs no such lift — figures come
 * out centred already.
 *
 * C_FILL is the knob: 1 makes each c exactly as tall as its quarter of the grid.
 */
const C_INK_H = 0.57
const C_INK_W = 0.433
const C_DROP = 0.085
const TWO_INK_H = 0.74

/** Both fills mean the same thing: the glyph's ink height as a multiple of one grid quarter. */
const C_FILL = 1.2
const TWO_FILL = 1.2

const C_SIZE = Math.round((CELL * C_FILL) / C_INK_H)
const C_LIFT = Math.round(C_SIZE * C_DROP)
const TWO_SIZE = Math.round((CELL * TWO_FILL) / TWO_INK_H)

/**
 * The c's sit against a uniform margin rather than on their cell centres — the glyph is round and
 * its ink is far narrower than it is tall, so centring in the quarters left the sides slack while
 * the top and bottom were flush.
 */
const MARGIN = 20
const INK_CENTRE_X = MARGIN + (C_SIZE * C_INK_W) / 2
const INK_CENTRE_Y = MARGIN + (C_SIZE * C_INK_H) / 2

/** Each glyph is centred on the whole canvas, so placement is an offset from that centre. */
const at = (x, y, style, children) =>
  glyph(
    { position: 'absolute', top: 0, left: 0, width: ICON, height: ICON, transform: `translate(${x}px, ${y}px)`, ...style },
    children
  )

/**
 * Puts a glyph's *ink* centre at an absolute point. The lift is a fixed downward offset inside the
 * box, so it is subtracted every time rather than mirrored along with the position.
 */
const place = (x, y, style, children) =>
  at(x - ICON / 2, y - ICON / 2 - C_LIFT, style, children)

/**
 * The masthead's treatment: white on a tight cyan core, a wider cyan, and a faint magenta halo,
 * with the 2 carrying magenta instead. Those blurs are authored for ~40px text, so they are taken
 * as em ratios and damped — at full strength the halo alone is wider than the canvas.
 */
const GLOW = 0.28
const blur = (size, em) => `${Math.round(size * em * GLOW)}px`

const C_GLOW = (size) =>
  [
    `0 0 ${blur(size, 0.2)} rgba(34, 232, 255, 0.9)`,
    `0 0 ${blur(size, 0.7)} rgba(34, 232, 255, 0.55)`,
    `0 0 ${blur(size, 1.5)} rgba(255, 43, 214, 0.35)`,
  ].join(', ')

const TWO_GLOW = (size) =>
  [
    `0 0 ${blur(size, 0.25)} rgba(255, 43, 214, 0.9)`,
    `0 0 ${blur(size, 0.8)} rgba(255, 43, 214, 0.5)`,
  ].join(', ')

/**
 * The angle the mark actually sits on, which is shallower than the 45 degrees of the grid it was
 * built from: the c's ink is taller than it is wide, so their centres are further apart
 * horizontally than vertically. Both c's are the same size, so a common tangent to the pair is
 * parallel to the line through their centres — this angle.
 */
const SLOPE = (Math.atan2(ICON - 2 * INK_CENTRE_Y, ICON - 2 * INK_CENTRE_X) * 180) / Math.PI

/**
 * A streak flanking the mark in each empty corner, riding that same tangent. Longer than the canvas
 * so it runs off both edges rather than floating as a dash — the gradient holds full strength
 * across the visible span and only falls away outside it.
 *
 * The core stays fully opaque and the softness comes entirely from the shadow. Fading the core
 * instead composites cyan onto near-black, so it reads as dirty rather than dim.
 */
const STREAK_LENGTH = ICON * 1.25
const STREAK_OFFSET = 0.855
const STREAK_THICKNESS = 15

/** The letters' treatment, scaled to a 14px bar rather than a 500px glyph. */
const STREAK_GLOW = '0 0 16px rgba(34, 232, 255, 0.85), 0 0 46px rgba(34, 232, 255, 0.45)'

const streak = (x, y, thickness = STREAK_THICKNESS) =>
  el({
    position: 'absolute',
    left: x - STREAK_LENGTH / 2,
    top: y - thickness / 2,
    width: STREAK_LENGTH,
    height: thickness,
    borderRadius: thickness,
    transform: `rotate(${SLOPE.toFixed(2)}deg)`,
    boxShadow: STREAK_GLOW,
    background: `linear-gradient(90deg, transparent, ${CYAN} 22%, ${CYAN} 78%, transparent)`,
  })

/**
 * c2c read as a mark: the two c's take opposite corners and the 2 lies across the middle of both,
 * turned onto the same diagonal they sit on. No backdrop grid or gradients — at 16px they turn to
 * mud.
 */
const favicon = el(
  {
    width: ICON,
    height: ICON,
    display: 'flex',
    background: VOID,
    fontFamily: FONT,
  },
  [
    streak(ICON * STREAK_OFFSET, ICON * (1 - STREAK_OFFSET)),
    streak(ICON * (1 - STREAK_OFFSET), ICON * STREAK_OFFSET),
    place(INK_CENTRE_X, INK_CENTRE_Y, { fontSize: C_SIZE, color: '#fff', textShadow: C_GLOW(C_SIZE) }, 'c'),
    place(
      ICON - INK_CENTRE_X,
      ICON - INK_CENTRE_Y,
      { fontSize: C_SIZE, color: '#fff', textShadow: C_GLOW(C_SIZE) },
      'c'
    ),
    at(
      0,
      0,
      {
        transform: 'rotate(25deg)',
        fontSize: TWO_SIZE,
        fontWeight: 700,
        color: MAGENTA,
        textShadow: TWO_GLOW(TWO_SIZE),
      },
      '2'
    ),
  ]
)

// ── Render ──────────────────────────────────────────────────────────────────────────────────────

const file = (weight) =>
  require.resolve(`@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${weight}-normal.woff`)

const fonts = [
  { name: FONT, data: await readFile(file(400)), weight: 400, style: 'normal' },
  { name: FONT, data: await readFile(file(700)), weight: 700, style: 'normal' },
]

/** `out` rasterises the authored size down, so small icons are resampled from vectors, not pixels. */
async function render(tree, { width, height }, out = width) {
  const svg = await satori(tree, { width, height, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: out } }).render().asPng()
}

/**
 * Rounds the corners in a second pass over the finished bitmap. resvg panics on `overflow: hidden`
 * anywhere a blur is in play, and the mark is nothing but glows, so the shape cannot be clipped
 * while it is being drawn. Clipping an image involves no filters and is safe.
 */
function roundCorners(png, size, radius) {
  const href = `data:image/png;base64,${png.toString('base64')}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <clipPath id="r"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></clipPath>
    <image href="${href}" width="${size}" height="${size}" clip-path="url(#r)"/>
  </svg>`
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
}

const outputs = [
  ['public/og.png', await render(preview, OG)],
  // Next picks this up by convention and emits the <link rel="icon"> itself.
  ['app/icon.png', roundCorners(await render(favicon, { width: ICON, height: ICON }), ICON, MARGIN)],
]

for (const [path, png] of outputs) {
  await mkdir(join(root, dirname(path)), { recursive: true })
  await writeFile(join(root, path), png)
  console.log(`${path} — ${(png.length / 1024).toFixed(1)} KB`)
}

