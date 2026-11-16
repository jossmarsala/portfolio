import { useCallback, useMemo, useState, lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/Navbar";
import DeferredMount from "@/components/ui/DeferredMount";
import {
  AppShellContext,
  type AppShellContextValue,
} from "@/context/AppShellContext";
import { hasBootedThisRuntime, markAppBooted } from "@/lib/runtime";

// Only loaded the first time the user opens the about panel.
const AboutSidebar = lazy(() => import("@/AboutSidebar"));
// The resume preview pulls the PDF toolchain only when a download is requested.
const ResumeModal = lazy(() => import("@/resume/ResumeModal"));
// Cursor visuals are non-critical; keep their JS (and GSAP) off the boot path.
const CustomCursor = lazy(() => import("@/CustomCursor"));

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
  const [resumeOpen, setResumeOpen] = useState(false);
  // Only desktop, fine-pointer, motion-friendly visitors need the cursor
  // bundle. Checking here keeps the chunk (and GSAP) off mobile entirely.
  const [customCursorEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  });

  useEffect(() => {
    markAppBooted();
  }, []);

  const completeLoader = useCallback(() => setLoaderDone(true), []);
  const openAbout = useCallback(() => setAboutOpen(true), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const openResume = useCallback(() => setResumeOpen(true), []);
  const closeResume = useCallback(() => setResumeOpen(false), []);

  const value = useMemo<AppShellContextValue>(
    () => ({
      loaderDone,
      completeLoader,
      aboutOpen,
      openAbout,
      closeAbout,
      resumeOpen,
      openResume,
      closeResume,
    }),
    [
      loaderDone,
      completeLoader,
      aboutOpen,
      openAbout,
      closeAbout,
      resumeOpen,
      openResume,
      closeResume,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {customCursorEnabled && (
        <Suspense fallback={null}>
          <DeferredMount mode="idle" idleTimeout={300}>
            <CustomCursor />
          </DeferredMount>
        </Suspense>
      )}
      <Navbar onAboutClick={openAbout} onResumeClick={openResume} />

      <Suspense fallback={null}>
        {aboutOpen && <AboutSidebar isOpen onClose={closeAbout} />}
        {resumeOpen && <ResumeModal onClose={closeResume} />}
      </Suspense>

      <main id="main">
        <Outlet />
      </main>
    </AppShellContext.Provider>
  );
}

export default RootLayout;
