import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Where the content comes from, and where readers go to change it.
 *
 * docs/ is exported from Origin Cloud's source repository on every merge
 * there; it is never edited here (CONTRIBUTING.md). The export writes the
 * commit it came from to docs/_export/version.json, which the site serves as
 * /version.json. A build without it fails: a site that can't say which
 * content it holds isn't deployed.
 */
export const REPOSITORY = 'https://github.com/origincloudhq/docs'

/** Where "Edit this page" leads: how a change to a page is made. */
export const EDIT_GUIDE = `${REPOSITORY}/blob/main/CONTRIBUTING.md#changing-a-page`

/** The issue form for a problem on one page, with its address filled in. */
export const reportIssueUrl = (pageUrl: string, title: string): string => {
  const q = new URLSearchParams({ template: 'page.yml', page: pageUrl, title: `Page: ${title}` })
  return `${REPOSITORY}/issues/new?${q}`
}

/**
 * A page's path in the source repository, from the loader's path under docs/:
 * docs/ here is docs/user/ there.
 */
export const sourcePath = (filePath: string | undefined): string | undefined =>
  filePath?.replace(/\\/g, '/').replace(/^(?:\.\.\/)?docs\//, 'docs/user/')

export interface Version {
  /** The source commit docs/ was exported from. */
  content_commit: string
  /** The commit of this repository the site was built from, when the build knows it. */
  site_commit: string | null
}

const COMMIT = /^[0-9a-f]{7,40}$/

export const version = (): Version => {
  const path = resolve('../docs/_export/version.json')
  let exported: { commit?: unknown }
  try {
    exported = JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    throw new Error(`${path}: the export's version file is missing or unreadable (${err})`)
  }
  if (typeof exported.commit !== 'string' || !COMMIT.test(exported.commit)) {
    throw new Error(`${path}: holds no commit`)
  }
  const site = process.env.SITE_COMMIT
  return {
    content_commit: exported.commit,
    site_commit: site && COMMIT.test(site) ? site : null,
  }
}
