/**
 * Wrap the wide blocks of a page body in the containers the stylesheet lays
 * out: every <table> in `.table-scroll`, so a narrow screen scrolls the table
 * and not the page, and every build-time Mermaid diagram (an <svg> whose id
 * starts with `mermaid`) in `.mermaid-figure`, at the diagram's own width.
 *
 * Runs after rehype-mermaid, which replaces each diagram's <pre> with its SVG.
 * Only direct children of a parent are wrapped, once: a table already inside
 * `.table-scroll` is left alone.
 */
const wrap = (node, className) => ({
  type: 'element',
  tagName: 'div',
  properties: { className: [className] },
  children: [node],
})

const isWrapped = (parent, className) =>
  parent.type === 'element' && (parent.properties?.className ?? []).includes(className)

const isMermaid = (node) =>
  node.type === 'element' && node.tagName === 'svg' && String(node.properties?.id ?? '').startsWith('mermaid')

// Mermaid sizes the SVG to its container (width="100%"), which shrinks a wide
// flowchart's 14 px labels to unreadable. Pin it to its own width instead; the
// figure scrolls sideways when the diagram is wider than the column.
const naturalSize = (svg) => {
  const width = Number(String(svg.properties?.viewBox ?? '').split(/\s+/)[2])
  if (!width) return svg
  svg.properties.style = `width: ${Math.ceil(width)}px; max-width: none; height: auto;`
  return svg
}

export function rehypeDocBlocks() {
  const visit = (parent) => {
    if (!parent.children) return
    parent.children = parent.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'table' && !isWrapped(parent, 'table-scroll')) {
        return wrap(child, 'table-scroll')
      }
      if (isMermaid(child) && !isWrapped(parent, 'mermaid-figure')) {
        return wrap(naturalSize(child), 'mermaid-figure')
      }
      visit(child)
      return child
    })
  }
  return (tree) => visit(tree)
}
