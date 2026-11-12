// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'
import rehypeMermaid from 'rehype-mermaid'
import { remarkStripTitle } from './src/lib/remark-strip-title.mjs'
import { remarkDocLinks } from './src/lib/remark-doc-links.mjs'
import { rehypeDocBlocks } from './src/lib/rehype-doc-blocks.mjs'
import { mermaidThemeVariables, mermaidFontFamily } from './src/lib/mermaid-theme.mjs'
import { brandCodeTheme, codeColors } from './src/styles/code-theme.mjs'

export default defineConfig({
  site: 'https://docs.origincloud.eu',

  integrations: [
    // Code blocks: syntax highlighting, window frames, line/text markers.
    // Themed from blueprint.css so code doesn't sit on a foreign palette.
    // Code blocks: syntax highlighting, window frames, line/text markers.
    // A Petrol 950 block on the light page, as in the brand kit's docs
    // template. Frame colours come from the same mirrored values as the
    // theme, because the block is dark whatever the page around it is.
    expressiveCode({
      themes: [brandCodeTheme],
      styleOverrides: {
        borderRadius: '4px',             // --radius
        // Invisible on the light page, a hairline on the dark one (docs.css).
        borderColor: 'var(--code-border)',
        codeFontFamily: 'var(--mono)',
        uiFontFamily: 'var(--sans)',
        codeFontSize: '13.5px',
        codeLineHeight: '1.65',
        codePaddingInline: '1.5rem',
        frames: {
          shadowColor: 'transparent',
          editorTabBarBackground: codeColors.titlebar,
          editorActiveTabBackground: codeColors.background,
          editorActiveTabForeground: codeColors.text,
          editorActiveTabIndicatorTopColor: codeColors.keyword,
          editorActiveTabBorderColor: codeColors.background,
          editorTabBarBorderBottomColor: codeColors.titlebar,
          terminalBackground: codeColors.background,
          terminalTitlebarBackground: codeColors.titlebar,
          terminalTitlebarForeground: codeColors.muted,
          terminalTitlebarDotsForeground: codeColors.muted,
          terminalTitlebarBorderBottomColor: codeColors.titlebar,
          inlineButtonForeground: codeColors.text,
          inlineButtonBorder: codeColors.muted,
          tooltipSuccessBackground: codeColors.border,
        },
      },
    }),
    mdx(),
    sitemap(),
  ],

  markdown: {
    // Off: smartypants rewrites `--flag` outside code spans into an em dash,
    // which turned CLI flags in headings into text a reader cannot copy, and
    // curls the quotes in commands. The source pages say what they mean.
    smartypants: false,
    remarkPlugins: [remarkStripTitle, remarkDocLinks],
    // Mermaid rendered to SVG at BUILD time via Playwright — the diagram
    // ships as markup, not as a client-side JS render. Keeps the page
    // zero-JS and leaves the diagram's text indexable.
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          // Load the brand fonts into the build-time browser, so labels are
          // measured in the font the reader sees them in. Without this the
          // build host's fallback sets the box sizes and Encode Sans then
          // overflows them.
          css: new URL('./public/fonts/fonts.css', import.meta.url),
          // Pages are exported from the source repository and carry no theme directive —
          // nor should they, since they are also read as plain Markdown on
          // GitHub. Theming belongs to whoever renders them, which is us.
          //
          // Rendered with the light theme's values; rehype-doc-blocks then ties
          // every colour to the page's theme (src/lib/mermaid-theme.mjs).
          mermaidConfig: {
            theme: 'base',
            themeVariables: mermaidThemeVariables,
            // Sequence diagrams take the top-level font, not themeVariables'.
            fontFamily: mermaidFontFamily,
          },
        },
      ],
      // After Mermaid, so the diagrams it produced get their figure wrapper.
      rehypeDocBlocks,
    ],
    syntaxHighlight: false, // Expressive Code owns this
  },
})
