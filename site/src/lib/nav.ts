import { getCollection, type CollectionEntry } from 'astro:content'

export type Doc = CollectionEntry<'docs'>

/**
 * Reading order across guides.
 *
 * The source gives every guide root `nav_order: 0`, because order within a guide is
 * all its schema expresses — nothing there knows the guides sit side by side on
 * one site. So the sequence is ours: start where a new reader starts (accounts,
 * access, getting started), then the services in dependency order, then the
 * things you consult rather than read.
 *
 * A guide missing from this list still renders; it sorts last, alphabetically.
 */
export const GUIDE_ORDER = [
  'platform',
  'compute',
  'storage',
  'network',
  'dns',
  'iam',
  'observability',
  'pricing',
]

export const guideRank = (name: string): number => {
  const i = GUIDE_ORDER.indexOf(name)
  return i === -1 ? GUIDE_ORDER.length : i
}

/** `compute/instances/lifecycle` -> guide `compute`. */
export const guideOf = (entry: Doc): string => entry.id.split('/')[0]

/** Route for a page. A guide's own index.md is the guide root. */
export const urlOf = (entry: Doc): string => {
  const path = entry.id.replace(/\/index$/, '').replace(/^index$/, '')
  return `/docs/${path}/`.replace(/\/+/g, '/')
}

export interface NavNode {
  entry: Doc
  children: NavNode[]
}

/**
 * Build one guide's tree from `parent`/`nav_order`.
 *
 * `parent` holds an `id` that is unique *within a guide*, not a path, so the
 * lookup is scoped per guide — two guides both have a `home`, and several have
 * a `reference`.
 */
export function buildGuideTree(entries: Doc[]): NavNode[] {
  const byLocalId = new Map<string, Doc>()
  for (const e of entries) byLocalId.set(e.data.id, e)

  const nodes = new Map<string, NavNode>()
  for (const e of entries) nodes.set(e.data.id, { entry: e, children: [] })

  const roots: NavNode[] = []
  for (const e of entries) {
    const node = nodes.get(e.data.id)!
    const parentId = e.data.parent
    const parent = parentId ? nodes.get(parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sort = (list: NavNode[]) => {
    list.sort((a, b) => a.entry.data.nav_order - b.entry.data.nav_order)
    list.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

export async function allGuides() {
  const docs = await getCollection('docs')
  const guides = new Map<string, Doc[]>()
  for (const d of docs) {
    const g = guideOf(d)
    if (!guides.has(g)) guides.set(g, [])
    guides.get(g)!.push(d)
  }
  return guides
}

export interface Guide {
  name: string
  /** The guide's root page: the one without a parent. */
  root: Doc
  /** Every page of the guide in navigation order, the root first. */
  pages: Doc[]
}

/** Every guide in reading order (GUIDE_ORDER), its pages in navigation order. */
export async function guidesInOrder(): Promise<Guide[]> {
  const flatten = (nodes: NavNode[]): Doc[] => nodes.flatMap((n) => [n.entry, ...flatten(n.children)])
  return [...(await allGuides()).entries()]
    .sort(([a], [b]) => guideRank(a) - guideRank(b) || a.localeCompare(b))
    .map(([name, entries]) => {
      const pages = flatten(buildGuideTree(entries))
      const root = entries.find((e) => e.data.parent === null)
      if (!root) throw new Error(`guide ${name}: no page without a parent`)
      return { name, root, pages }
    })
}

/** The label a page that isn't generally available carries under its title. */
export const availabilityLabel = (entry: Doc): string | undefined =>
  entry.data.availability === 'preview' ? 'Preview: may change'
  : entry.data.availability === 'deprecated' ? 'Deprecated'
  : undefined

/** Breadcrumb from the guide root down to (but not including) `entry`. */
export function ancestorsOf(entry: Doc, entries: Doc[]): Doc[] {
  const byLocalId = new Map(entries.map((e) => [e.data.id, e]))
  const chain: Doc[] = []
  let cur: Doc | undefined = entry
  const seen = new Set<string>()
  while (cur?.data.parent) {
    if (seen.has(cur.data.id)) break        // a cycle would otherwise hang the build
    seen.add(cur.data.id)
    const next: Doc | undefined = byLocalId.get(cur.data.parent)
    if (!next) break
    chain.unshift(next)
    cur = next
  }
  return chain
}
