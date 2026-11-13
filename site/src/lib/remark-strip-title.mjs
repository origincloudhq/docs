/**
 * Remove the leading H1 from a page body.
 *
 * Pages come from the source repository, where they are also read as plain Markdown
 * on GitHub — so each one opens with its own `# Title`. This site renders the
 * title from frontmatter into the page head, so leaving the body heading in
 * place shows it twice and puts two h1 elements on the page.
 *
 * Only a heading that is genuinely first is removed; a page whose body opens
 * with something else is left alone.
 */
export function remarkStripTitle() {
  return (tree) => {
    const first = tree.children?.[0]
    if (first && first.type === 'heading' && first.depth === 1) {
      tree.children.shift()
    }
  }
}
