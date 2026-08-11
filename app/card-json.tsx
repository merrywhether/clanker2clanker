import { Fragment, ReactNode } from 'react'

/**
 * Keys, strings, numbers and literals, in that precedence. A key is a string followed by a colon,
 * so the lookahead is what separates the two string cases.
 */
const TOKEN =
  /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

const CLASSES = ['tok-key', 'tok-string', 'tok-literal', 'tok-number']

/**
 * Colors the card body. Everything the regex does not claim — braces, brackets, colons, commas —
 * keeps the container's dim color, which is what makes the values read first.
 */
export function CardJson({ json }: { json: string }) {
  const parts: ReactNode[] = []
  let cursor = 0

  for (const match of json.matchAll(TOKEN)) {
    const index = match.index
    if (index > cursor) {
      parts.push(json.slice(cursor, index))
    }

    const group = CLASSES.findIndex((_, i) => match[i + 1] !== undefined)
    parts.push(
      <span key={index} className={CLASSES[group]}>
        {match[0]}
      </span>
    )
    cursor = index + match[0].length
  }

  parts.push(json.slice(cursor))

  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>
}
