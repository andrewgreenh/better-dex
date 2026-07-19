import { PokedexList } from "@/components/PokedexList";

/**
 * The home page renders the full list directly instead of redirecting:
 * iOS refuses to open installed PWAs whose start_url is served as a
 * redirect through the service worker.
 */
export default function Home() {
  return <PokedexList />;
}
