import { getGermanNames, spriteUrl } from "@/lib/pokeapi";

async function getSearchIndex() {
  "use cache";
  const names = await getGermanNames();
  return Object.entries(names).map(([id, name]) => ({
    id: Number(id),
    name,
    sprite: spriteUrl(Number(id)),
  }));
}

/** Static JSON index of all German names for the client-side search. */
export async function GET() {
  const index = await getSearchIndex();
  return Response.json(index, {
    headers: { "cache-control": "public, max-age=86400, immutable" },
  });
}
