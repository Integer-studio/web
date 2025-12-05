import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/pages/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tags: z.array(z.string()),
      year: z.string(),
      description: z.string(),
      image: image(),
      priority: z.number(),
      featured: z.boolean().optional(),
      links: z
        .array(
          z.object({
            name: z.string(),
            url: z.string(),
          })
        )
        .optional(),
    }),
});

export const collections = { projects };
