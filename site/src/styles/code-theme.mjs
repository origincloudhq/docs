/**
 * Origin Cloud code blocks: Expressive Code / Shiki theme, Brand System v2.
 *
 * Code sits on a Petrol 950 block in the light page, as in the brand kit's
 * docs template (guide/layout.html) and its terminal component.
 *
 * Shiki themes are resolved to real colour values at build time, so unlike
 * every stylesheet in this project this file cannot reference the custom
 * properties in brand/tokens.css. The values below are MIRRORED from the
 * primitives there, not chosen here. Re-copy them when the tokens change.
 *
 * Role mapping. Copper means money and action and nothing else, and the
 * status colours report state, so neither appears in syntax highlighting.
 * Highlighting stays inside Petrol and grey, distinguished by lightness:
 *   keyword / storage    -> Petrol 400
 *   string               -> Petrol 200
 *   number / constant    -> Petrol 300
 *   function / type      -> white
 *   text                 -> Grey 200
 *   punctuation, comment -> Grey 400 (comments in italics)
 * Every foreground clears 7:1 on the block background.
 */

export const codeColors = {
  background: '#002024',    // --petrol-950
  titlebar: '#002E33',      // --petrol-900
  border: '#005C66',        // --petrol-800
  text: '#E3E7E8',          // --grey-200
  muted: '#A5AEB1',         // --grey-400
  keyword: '#7AC9D6',       // --petrol-400
  string: '#C2E8EE',        // --petrol-200
  constant: '#A0D9E3',      // --petrol-300
  name: '#FFFFFF',          // --white
  selection: '#005C66',     // --petrol-800
}

const c = codeColors

export const brandCodeTheme = {
  name: 'origincloud-v2',
  type: 'dark',
  colors: {
    'editor.background': c.background,
    'editor.foreground': c.text,
    'editor.lineHighlightBackground': c.titlebar,
    'editor.selectionBackground': c.selection,
    'editorLineNumber.foreground': c.muted,
    'editorLineNumber.activeForeground': c.text,
    'panel.border': c.border,
    'terminal.background': c.background,
    'terminal.foreground': c.text,
    'titleBar.activeBackground': c.titlebar,
    'tab.activeBackground': c.background,
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'keyword.operator', 'storage', 'storage.type', 'keyword.control'], settings: { foreground: c.keyword } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag'], settings: { foreground: c.name } },
    { scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'], settings: { foreground: c.name } },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: c.string } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: c.constant } },
    { scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.type.property-name'], settings: { foreground: c.text } },
    { scope: ['variable.parameter', 'entity.other.attribute-name'], settings: { foreground: c.text, fontStyle: 'italic' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: c.muted } },
    { scope: ['invalid', 'markup.deleted'], settings: { foreground: c.muted, fontStyle: 'strikethrough' } },
    { scope: ['markup.inserted'], settings: { foreground: c.name } },
  ],
}
