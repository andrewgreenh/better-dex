import { useEffect } from "react";

/** Document titles are set client-side — there is no server rendering. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
