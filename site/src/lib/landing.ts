/**
 * What the docs landing page (/docs/) says beyond the guides, shared by its
 * HTML (pages/docs/index.astro) and its Markdown version
 * (pages/docs/index.html.md.ts), so the two can't drift.
 */
export const LANDING_TITLE = 'Origin Cloud documentation'

export const LANDING_DESCRIPTION =
  'User documentation for Origin Cloud: one guide per service, for anyone calling the API or the origin CLI.'

/** Markdown; inline code in backticks is the only markup. */
export const LANDING_LEAD =
  'What the platform can do, written for someone calling the GraphQL API or the `origin` CLI, not for ' +
  'someone reading the source. One guide per service, each covering the capabilities you can use and the ' +
  "parts of the platform's own process you need in order to automate around it."

/**
 * The way back into origincloud.eu. Someone reading the docs is
 * mid-evaluation, which is the moment "what does it cost" and "what else is
 * there" get asked, and the landing page would otherwise answer neither.
 */
export const OFFSITE = [
  { title: 'All services', text: 'What is live today, and what is planned.', href: 'https://www.origincloud.eu/cloud-services/' },
  { title: 'Compute rates', text: 'Published hourly, per instance type.', href: 'https://www.origincloud.eu/compute/pricing/' },
  { title: 'Volume rates', text: 'Published per provisioned GiB, per month.', href: 'https://www.origincloud.eu/pvs/pricing/' },
]
