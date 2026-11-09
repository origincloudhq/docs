/**
 * Origin Cloud "blueprint" — Expressive Code / Shiki theme.
 *
 * Shiki themes are resolved to real color values at build time, so unlike
 * every other stylesheet in this project this file cannot reference the
 * custom properties in tokens.css. The values below are therefore MIRRORED
 * from tokens.css (the vendored copy of origincloud-brand's blueprint.css),
 * not chosen here. Re-copy them when that file changes — same low-tech
 * vendoring pattern the brand skill prescribes for the tokens themselves.
 *
 * Role mapping. The brand reserves each hue: copper = action/signal, blue =
 * structural, sage/gold/coral = status. Syntax highlighting is a domain the
 * brand rules don't cover, so the mapping keeps each hue's *character*
 * rather than inventing new ones:
 *   keyword / operator  -> copper   (the verbs — what the code does)
 *   type / function     -> blue     (structure)
 *   string              -> sage
 *   number / constant   -> gold
 *   deleted / invalid   -> coral
 *   comment             -> text-muted
 * No hue outside the canonical palette is introduced.
 */

const ink = '#101318'        // --ink
const surface1 = '#191d24'   // --surface-1
const surface2 = '#20242c'   // --surface-2
const surface3 = '#262b34'   // --surface-3
const text = '#ede9e0'       // --text
const textSoft = '#b7b3a8'   // --text-soft
const textMuted = '#7c8089'  // --text-muted
const copper = '#e2793d'     // --copper
const blue = '#6fa3d6'       // --blue
const sage = '#6db28e'       // --sage
const gold = '#d9a441'       // --gold
const coral = '#d9584b'      // --coral

export const blueprintCodeTheme = {
  name: 'origincloud-blueprint',
  type: 'dark',
  colors: {
    'editor.background': surface1,
    'editor.foreground': text,
    'editor.lineHighlightBackground': surface2,
    'editor.selectionBackground': '#6fa3d633',
    'editorLineNumber.foreground': textMuted,
    'editorLineNumber.activeForeground': copper,
    'panel.border': '#6fa3d647',
    'terminal.background': surface1,
    'terminal.foreground': text,
    'titleBar.activeBackground': ink,
    'tab.activeBackground': surface3,
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: textMuted, fontStyle: 'italic' } },
    { scope: ['keyword', 'keyword.operator', 'storage', 'storage.type', 'keyword.control'], settings: { foreground: copper } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag'], settings: { foreground: blue } },
    { scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'], settings: { foreground: blue } },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: sage } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: gold } },
    { scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.type.property-name'], settings: { foreground: text } },
    { scope: ['variable.parameter', 'entity.other.attribute-name'], settings: { foreground: textSoft } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: textSoft } },
    { scope: ['invalid', 'markup.deleted'], settings: { foreground: coral } },
    { scope: ['markup.inserted'], settings: { foreground: sage } },
  ],
}
