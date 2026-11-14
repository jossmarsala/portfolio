import { useCallback, useMemo, useState, lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CustomCursor from "@/CustomCursor";
import Navbar from "@/Navbar";
import {
  AppShellContext,
  type AppShellContextValue,
} from "@/context/AppShellContext";
import { hasBootedThisRuntime, markAppBooted } from "@/lib/runtime";

// Only loaded the first time the user opens the about panel.
const AboutSidebar = lazy(() => import("@/AboutSidebar"));

/**
 * Persistent application shell: cursor, navigation, about panel and the route
 * outlet. Pages own their content and scroll behaviour; the shell owns chrome.
 */
export function RootLayout() {
  const { pathname } = useLocation();
  const [loaderDone, setLoaderDone] = useState(
    () => pathname !== "/" || hasBootedThisRuntime(),
  );
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    markAppBooted();
  }, []);

  const completeLoader = useCallback(() => setLoaderDone(true), []);
  const openAbout = useCallback(() => setAboutOpen(true), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);

  const value = useMemo<AppShellContextValue>(
    () => ({
      loaderDone,
      completeLoader,
      aboutOpen,
      openAbout,
      closeAbout,
    }),
    [loaderDone, completeLoader, aboutOpen, openAbout, closeAbout],
  );

  return (
    <AppShellContext.Provider value={value}>
      <CustomCursor />
      <Navbar onAboutClick={openAbout} />

      <Suspense fallback={null}>
        {aboutOpen && <AboutSidebar isOpen onClose={closeAbout} />}
      </Suspense>

      <main id="main">
        <Outlet />
      </main>
    </AppShellContext.Provider>
  );
}

export default RootLayout;
