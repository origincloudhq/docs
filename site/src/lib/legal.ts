/**
 * Where this site's legal pages live. Single source of truth for both the
 * footer links and Klaro's `privacyPolicy`/`imprint` entries, so the consent
 * dialog and the page can never point at different pages.
 *
 * This site has none of its own: docs.origincloud.eu is a subdomain of the
 * same provider, so it points at the marketing site's pages rather than
 * keeping a second copy of legal text that would drift.
 *
 * Absolute, and `www.` on purpose — that is origincloud.eu's canonical
 * spelling. The apex answers too, but
 * linking it would add a redirect hop for no gain.
 */
export const IMPRINT = 'https://www.origincloud.eu/legal-notice/'
export const PRIVACY = 'https://www.origincloud.eu/privacy-policy/'
