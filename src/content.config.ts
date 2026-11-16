import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /* Short one-liner shown under the title on the featured card. */
      subtitle: z.string().optional(),
      tags: z.array(z.string()),
      year: z.string(),
      /* Used as the body of the small cards. */
      description: z.string(),
      image: image(),
      /* `logo` sets the image (an SVG lockup) centred on a brand panel
         instead of filling the slot like a screenshot. Featured card only. */
      imageStyle: z.enum(['screenshot', 'logo']).default('screenshot'),
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
