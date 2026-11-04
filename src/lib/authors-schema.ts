import { z } from "astro/zod";

/*
 * Shape of one author / medical reviewer on disk, src/content/authors/<slug>.json (SEO & GEO dashboard, 30 Oct 2026).
 * Posts point at an author by slug (`author` / `reviewer` in src/content/news/<slug>.json); the article byline, the
 * "Reviewed by" line, the author page and the Person schema are filled from here. Text fields are { en, ar? } like the
 * rest of the site's entity data (src/lib/content.ts Localized): Arabic absent = English shown on the Arabic editions.
 * Nothing is loaded from the client's data yet: the list starts empty and the dashboard fills it.
 */
const localized = z.object({ en: z.string().min(1), ar: z.string().optional() }).strict();
const optionalLocalized = z.object({ en: z.string().default(""), ar: z.string().optional() }).strict();

export const authorSchema = z
  .object({
    /** = the file name; author page media-hub/author/<slug> */
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: localized,
    /** e.g. "Consultant Neurologist" */
    role: optionalLocalized.optional(),
    /** e.g. "MD, FRCP" (schema.org hasCredential) */
    credentials: z.string().default(""),
    bio: optionalLocalized.optional(),
    /** image key under src/assets (authors/<slug>) or an uploaded file; "" = no photo */
    photo: z.string().default(""),
    linkedin: z.string().default(""),
    /** other profile URLs (schema.org sameAs) */
    same_as: z.array(z.string()).default([]),
    /** false = hidden from bylines and the author page (posts keep the reference) */
    active: z.boolean().default(true),
  })
  .strict();

export type AuthorFile = z.infer<typeof authorSchema>;
