import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/journal' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kategorie: z.enum(['neuheiten', 'martin-edition', 'uebergaben', 'haus', 'service']),
      standort: z.enum(['schongau', 'weyarn', 'oy-mittelberg']).optional(),
      teaser: z.string().default(''),
      cover: image().optional(),
      galerie: z.array(image()).default([]),
      reihenfolge: z.number(),
      quelle: z.string().optional(),
    }),
});

const jobs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/jobs' }),
  schema: z.object({
    title: z.string(),
    standort: z.enum(['schongau', 'weyarn', 'oy-mittelberg']),
    art: z.string(),
    gueltigBis: z.string().optional(),
    teaser: z.string().default(''),
    kontakt: z.string().optional(),
    quelle: z.string().optional(),
  }),
});

const modelle = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/modelle' }),
  schema: z.object({
    title: z.string(),
    modell: z.string(),
    teaser: z.string().default(''),
    reihenfolge: z.number(),
    quelle: z.string().optional(),
  }),
});

const recht = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/recht' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { journal, jobs, modelle, recht };
