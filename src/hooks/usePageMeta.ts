import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
}

/**
 * Custom hook to update document title and meta description per page
 * Ensures compliance with SEO and accessibility standards.
 */
export function usePageMeta({ title, description }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${title} | AgroDirect Hub`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description]);
}
