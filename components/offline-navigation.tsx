"use client";

import { useEffect } from "react";

export function OfflineNavigation() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      const url = new URL(link.href, window.location.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      window.location.assign(url.href);
    }

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
