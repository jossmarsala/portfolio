import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Section links (e.g. "#work") can be triggered from any route. On the home
 * page we scroll immediately; elsewhere we navigate home and hand the target to
 * HomePage, which waits for lazy sections and the intro loader to settle.
 */
export function useSectionNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (href: string) => {
      const id = href.replace(/^#/, "");

      if (pathname === "/") {
        const element = document.getElementById(id);
        if (element) {
          const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          element.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start",
          });
        }
        return;
      }

      navigate("/", { state: { scrollTo: id } });
    },
    [navigate, pathname],
  );
}
