// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'
import rehypeMermaid from 'rehype-mermaid'
import { remarkStripTitle } from './src/lib/remark-strip-title.mjs'
import { remarkDocLinks } from './src/lib/remark-doc-links.mjs'
import { blueprintCodeTheme } from './src/styles/code-theme.mjs'

export default defineConfig({
  site: 'https://docs.origincloud.eu',

  integrations: [
    // Code blocks: syntax highlighting, window frames, line/text markers.
    // Themed from blueprint.css so code doesn't sit on a foreign palette.
    expressiveCode({
      themes: [blueprintCodeTheme],
      styleOverrides: {
        borderRadius: '0.25rem',        // brand: sharp, measured corners
        borderColor: 'var(--line-strong)',
        codeFontFamily: 'var(--font-mono)',
        uiFontFamily: 'var(--font-mono)',
        codeFontSize: '0.8125rem',
        codeLineHeight: '1.7',
        frames: {
          shadowColor: 'transparent',
          editorTabBarBackground: 'var(--surface-0)',
          editorActiveTabBackground: 'var(--surface-2)',
          editorActiveTabIndicatorTopColor: 'var(--copper)',
          editorActiveTabBorderColor: 'var(--line-strong)',
          editorTabBarBorderBottomColor: 'var(--line-strong)',
          terminalBackground: 'var(--surface-1)',
          terminalTitlebarBackground: 'var(--surface-0)',
          terminalTitlebarBorderBottomColor: 'var(--line-strong)',
        },
      },
    }),
    mdx(),
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [remarkStripTitle, remarkDocLinks],
    // Mermaid rendered to SVG at BUILD time via Playwright — the diagram
    // ships as markup, not as a client-side JS render. Keeps the page
    // zero-JS and leaves the diagram's text indexable.
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          // Pages are exported from the source repository and carry no theme directive —
          // nor should they, since they are also read as plain Markdown on
          // GitHub. Theming belongs to whoever renders them, which is us.
          //
          // Values mirror tokens.css. Mermaid resolves colours at render time
          // and cannot read CSS custom properties, the same constraint
          // code-theme.mjs documents.
          mermaidConfig: {
            theme: 'base',
            themeVariables: {
              darkMode: true,
              background: '#14171d',          // --surface-0
              primaryColor: '#20242c',        // --surface-2, node fill
              primaryTextColor: '#ede9e0',    // --text
              primaryBorderColor: '#6fa3d6',  // --blue, structural
              lineColor: '#6fa3d6',
              secondaryColor: '#1a2430',
              tertiaryColor: '#14171d',
              fontFamily: 'monospace',        // the build host has no webfonts
              fontSize: '13px',
              textColor: '#ede9e0',
              labelColor: '#ede9e0',
              edgeLabelBackground: '#14171d',
              clusterBkg: '#14171d',
              clusterBorder: '#6fa3d647',
              noteBkgColor: '#2a1c1b',
              noteTextColor: '#d9584b',
              noteBorderColor: '#d9584b',
            },
          },
        },
      ],
    ],
    syntaxHighlight: false, // Expressive Code owns this
  },
})
