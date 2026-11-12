// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'
import rehypeMermaid from 'rehype-mermaid'
import { remarkStripTitle } from './src/lib/remark-strip-title.mjs'
import { remarkDocLinks } from './src/lib/remark-doc-links.mjs'
import { rehypeDocBlocks } from './src/lib/rehype-doc-blocks.mjs'
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
        borderColor: codeColors.background,
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
          // Values mirror the light theme in brand/tokens.css: Mermaid resolves
          // colours at render time and cannot read CSS custom properties, the
          // same constraint code-theme.mjs documents. Petrol for structure,
          // grey surfaces, no copper and no status colours.
          mermaidConfig: {
            theme: 'base',
            themeVariables: {
              darkMode: false,
              background: '#FFFFFF',          // --surface-0
              primaryColor: '#F2F4F5',        // --surface-2, node fill
              primaryTextColor: '#002024',    // --text
              primaryBorderColor: '#005C66',  // --blue, structural
              secondaryColor: '#EEF9FB',      // --blue-soft
              secondaryTextColor: '#002024',
              secondaryBorderColor: '#005C66',
              tertiaryColor: '#FFFFFF',
              tertiaryTextColor: '#002024',
              tertiaryBorderColor: '#CDD4D6', // --line-strong
              lineColor: '#626D6F',           // --text-muted
              textColor: '#002024',
              labelColor: '#002024',
              edgeLabelBackground: '#FFFFFF',
              clusterBkg: '#F9FAFB',          // --ink
              clusterBorder: '#CDD4D6',
              noteBkgColor: '#EEF9FB',        // a note is info: --blue-soft
              noteTextColor: '#002024',
              noteBorderColor: '#005C66',
              actorBkg: '#F2F4F5',
              actorBorder: '#005C66',
              actorTextColor: '#002024',
              actorLineColor: '#A5AEB1',
              signalColor: '#002024',
              signalTextColor: '#002024',
              fontFamily: '"Encode Sans", system-ui, sans-serif',
              fontSize: '14px',
            },
          },
        },
      ],
      // After Mermaid, so the diagrams it produced get their figure wrapper.
      rehypeDocBlocks,
    ],
    syntaxHighlight: false, // Expressive Code owns this
  },
})
