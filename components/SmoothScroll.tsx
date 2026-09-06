"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let activeLenis: Lenis | null = null;

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    });
    activeLenis = lenis;
    let frameId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
      activeLenis = null;
    };
  }, []);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;

      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== pathname ||
        !url.hash
      ) {
        return;
      }

      const destination = document.querySelector<HTMLElement>(url.hash);
      if (!destination) return;

      event.preventDefault();
      if (activeLenis) {
        activeLenis.scrollTo(destination, { duration: 1.05, offset: -12 });
      } else {
        destination.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.history.pushState(null, "", url.hash);
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (activeLenis) {
      activeLenis.scrollTo(0, { duration: 1.05 });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname]);

  return null;
}
