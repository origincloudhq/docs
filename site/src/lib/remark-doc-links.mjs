import path from 'node:path'

/**
 * Rewrite relative `.md` links to site routes.
 *
 * Pages come from the source repository, where they are also browsed as plain
 * Markdown on GitHub — so they link to each other by file path
 * (`terminate.md`, `../../platform/access/cli.md`). Those are correct there
 * and dead here, because the site serves directories, not files.
 *
 * Resolving against the current file's own location is what makes this work
 * for a sibling link and one reaching across guides alike.
 */
const DOCS_ROOT = path.resolve('../docs')

const toRoute = (absMdPath) => {
  const rel = path.relative(DOCS_ROOT, absMdPath).replace(/\\/g, '/')
  if (rel.startsWith('..')) return null              // outside the tree; leave alone
  const stripped = rel.replace(/\.md$/, '').replace(/(^|\/)index$/, '')
  return `/docs/${stripped}/`.replace(/\/+/g, '/')
}

const walk = (node, fn) => {
  fn(node)
  for (const child of node.children ?? []) walk(child, fn)
}

export function remarkDocLinks() {
  return (tree, file) => {
    const self = file?.path
    if (!self) return

    walk(tree, (node) => {
      if (node.type !== 'link' && node.type !== 'definition') return
      const url = node.url ?? ''
      if (/^(https?:|mailto:|#|\/)/.test(url)) return

      const [target, anchor] = url.split('#')
      if (!target.endsWith('.md')) return

      const route = toRoute(path.resolve(path.dirname(self), target))
      if (route) node.url = anchor ? `${route}#${anchor}` : route
    })
  }
}
