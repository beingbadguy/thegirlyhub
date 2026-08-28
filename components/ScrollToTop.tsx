"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      // Reset window and document scroll positions
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Reset scroll positions of any custom overflow-y scrollable containers
      // (e.g. dashboard panel containers, main wrappers, etc.)
      const scrollableContainers = document.querySelectorAll(
        ".overflow-y-auto, .overflow-y-scroll, [class*='overflow-y-']"
      );
      scrollableContainers.forEach((container) => {
        container.scrollTop = 0;
      });
    };

    // Scroll immediately when pathname changes
    handleScroll();

    // Run again after a short delay to account for asynchronous content hydration/rendering
    const timer = setTimeout(handleScroll, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
