import type { APIRoute } from 'astro';
import { editionFromBase, editionPaths } from '../../../lib/editions';
import { postsFor } from '../../../lib/news';
import { cardData } from '../../../lib/news-image';

export const getStaticPaths = editionPaths;

// Index of ALL posts of the edition (newest first) with ready-to-render card data. The Media Hub script loads it once
// to filter by category and to add more cards while the row is scrolled, so filtering covers every post.
export const GET: APIRoute = async ({ params }) => {
  const edition = editionFromBase(params.base);
  const cards = await Promise.all(postsFor(edition).map((p) => cardData(p, edition)));
  return new Response(JSON.stringify(cards), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
