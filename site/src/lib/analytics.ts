/**
 * Single source of truth for whether analytics is active and which tag it
 * loads. Both <Analytics> and <PrivacySettings> read this, so the banner and
 * the "Privacy settings" control can never disagree about whether a consent
 * manager exists on the page.
 *
 * The ID is public by design — it ships in every page's HTML.
 *
 * Three accepted forms, matching origincloud.eu's:
 *   GTM-…  Tag Manager       -> the container snippet. Klaro also pushes
 *                               `klaro-google-analytics-accepted`, which is
 *                               the custom event trigger that container uses
 *                               to gate its Analytics tag.
 *   GT-…   Google tag        -> gtag.js; destinations configured in the
 *                               Google tag UI.
 *   G-…    GA4 measurement   -> gtag.js, straight to that one property.
 *
 * Only GTM- needs the Tag Manager loader; GT- and G- are both plain gtag.js.
 *
 * We share origincloud.eu's container rather than running a second one, so
 * both properties measure through the same setup and docs.origincloud.eu is
 * registered on it as an additional domain. That also means the consent
 * trigger already exists there — it is the same one the marketing site's
 * Klaro config fires.
 */
export const analyticsId: string =
  import.meta.env.PUBLIC_ANALYTICS_ID ?? 'GTM-KDR6WVGD'

export const isTagManager = analyticsId.startsWith('GTM-')

/** Production builds only: `astro dev` never loads a banner or a tag. */
export const analyticsEnabled = import.meta.env.PROD && !!analyticsId
