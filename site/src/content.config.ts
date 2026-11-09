import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * The schema is the source repository's `user-docs` frontmatter, which was written
 * to fit this site: title, description, eyebrow, lead and specs are the same
 * fields and limits the old five-page collection used.
 *
 * Unknown keys are an error on purpose (`.strict()`), so a typo like `nav-order`
 * fails the build rather than silently doing nothing — the same reasoning the
 * upstream checker gives.
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../docs' }),
  schema: z
    .object({
      id: z.string(),
      title: z.string().max(70),
      description: z.string().min(50).max(200),
      page_type: z.enum(['overview', 'concept', 'task', 'tutorial', 'reference', 'troubleshooting']),
      parent: z.string().nullable(),
      nav_order: z.number().int(),

      tags: z.array(z.string()).max(6).optional(),
      last_reviewed: z.coerce.date().optional(),

      nav_title: z.string().max(30).optional(),
      seo_title: z.string().max(60).optional(),
      slug: z.string().optional(),
      redirect_from: z.array(z.string()).optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().optional(),
      availability: z.enum(['ga', 'preview', 'deprecated']).optional(),
      related: z.array(z.string()).max(5).optional(),
      og_image: z.string().optional(),
      eyebrow: z.string().optional(),
      lead: z.string().optional(),
      specs: z.array(z.object({ label: z.string(), value: z.string() })).max(4).optional(),
      toc: z.boolean().optional(),
    })
    .strict(),
})

export const collections = { docs }
