/**
 * Mermaid diagrams that follow the page's light or dark theme.
 *
 * Mermaid resolves colours at render time and cannot read CSS custom
 * properties: it derives shades from what it is given, so a `var()` would
 * break it. The diagrams are therefore rendered once, with the LIGHT theme's
 * values (mirrored from brand/tokens.css), and `themeDiagram` then rewrites
 * every colour it knows in the finished SVG to `var(--role, <light value>)`.
 * The same SVG takes the dark values when the page switches theme, and keeps
 * the light ones wherever the custom property is missing.
 *
 * A colour Mermaid uses that is not listed here stays as it is. The list holds
 * every colour the current diagrams use (flowchart, state, sequence); a new
 * diagram type may bring one more, so check a dark page after adding one.
 */

// The light value each role is rendered with, and the token it maps to.
const ROLE = {
  surface: ['#FFFFFF', '--surface-0'],
  fill: ['#F2F4F5', '--surface-2'],
  fillStrong: ['#E3E7E8', '--surface-3'],
  backdrop: ['#F9FAFB', '--ink'],
  text: ['#002024', '--text'],
  muted: ['#626D6F', '--text-muted'],
  structure: ['#005C66', '--blue'],
  info: ['#EEF9FB', '--blue-soft'],
  line: ['#CDD4D6', '--line-strong'],
}

const light = (role) => ROLE[role][0]

/** Mermaid's `base` theme, set from the roles above. */
export const mermaidThemeVariables = {
  darkMode: false,
  background: light('surface'),
  primaryColor: light('fill'),            // node fill
  primaryTextColor: light('text'),
  primaryBorderColor: light('structure'),
  secondaryColor: light('info'),
  secondaryTextColor: light('text'),
  secondaryBorderColor: light('structure'),
  tertiaryColor: light('surface'),
  tertiaryTextColor: light('text'),
  tertiaryBorderColor: light('line'),
  lineColor: light('muted'),
  textColor: light('text'),
  labelColor: light('text'),
  edgeLabelBackground: light('surface'),
  clusterBkg: light('backdrop'),
  clusterBorder: light('line'),
  noteBkgColor: light('info'),            // a note is information
  noteTextColor: light('text'),
  noteBorderColor: light('structure'),
  actorBkg: light('fill'),
  actorBorder: light('structure'),
  actorTextColor: light('text'),
  actorLineColor: light('line'),
  signalColor: light('text'),
  signalTextColor: light('text'),
  fontFamily: '"Encode Sans", system-ui, sans-serif',
  fontSize: '14px',
}

/** The top-level font: the only one sequence diagrams use. */
export const mermaidFontFamily = 'Encode Sans, system-ui, sans-serif'

// Every colour in the rendered SVGs, by the role it plays. The first block is
// what the theme above produces; the second, Mermaid's own fixed defaults.
const COLOUR_ROLE = new Map(
  Object.entries({
    ...Object.fromEntries(Object.entries(ROLE).map(([role, [hex]]) => [hex, role])),
    '#A5AEB1': 'line',          // an earlier actor line value, kept harmless
    '#000000': 'text',          // arrowheads, the state diagram's start dot
    '#000': 'text',
    '#666': 'muted',            // sequence activation border
    '#999': 'line',             // sequence actor line
    '#eaeaea': 'fillStrong',    // sequence activation fill
    '#e0e0e0': 'fillStrong',    // composite state background
    '#9d9290': 'muted',         // sequence numbers
    '#EDF2AE': 'info',          // a note's default fill
    'rgba(255, 255, 255, 0.5)': 'surface',  // edge label background
  }).map(([colour, role]) => [colour.toLowerCase(), role])
)
// Mermaid's derived activation stroke, an hsl() of the info colour.
const HSL = /hsla?\([^)]*\)/gi

const pattern = new RegExp(
  [...COLOUR_ROLE.keys()]
    .sort((a, b) => b.length - a.length)  // the six-digit black before the three-digit one
    .map((c) => c.replace(/[()]/g, '\\$&'))
    .join('|') + '(?![0-9a-f])',
  'gi'
)

const toVar = (role) => `var(${ROLE[role][1]}, ${ROLE[role][0]})`

/** Replace every known colour in a piece of CSS or an attribute value. */
const recolour = (text) =>
  text
    .replace(pattern, (m) => toVar(COLOUR_ROLE.get(m.toLowerCase())))
    .replace(HSL, toVar('structure'))

const PAINT = ['fill', 'stroke', 'floodColor', 'stopColor', 'color']
const CSS_NAME = { floodColor: 'flood-color', stopColor: 'stop-color' }

/**
 * Rewrite one rendered diagram in place. `var()` is not valid in a
 * presentation attribute (fill="..."), so a recoloured attribute moves into
 * the element's style, where it is.
 */
export function themeDiagram(node) {
  if (node.type === 'text' || node.type === 'raw') return
  if (node.type !== 'element') return node.children?.forEach(themeDiagram)

  if (node.tagName === 'style') {
    node.children.forEach((c) => { if (c.value) c.value = recolour(c.value) })
    return
  }
  const props = node.properties ?? {}
  const moved = []
  for (const key of PAINT) {
    const value = props[key]
    if (typeof value !== 'string') continue
    const next = recolour(value)
    if (next !== value) {
      moved.push(`${CSS_NAME[key] ?? key}: ${next}`)
      delete props[key]
    }
  }
  if (typeof props.style === 'string') props.style = recolour(props.style)
  if (moved.length) props.style = [props.style, ...moved].filter(Boolean).join('; ')
  node.children?.forEach(themeDiagram)
}
