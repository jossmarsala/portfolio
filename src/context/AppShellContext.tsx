import { createContext, useContext } from "react";

export interface AppShellContextValue {
  /** Intro loader state for the home route. */
  loaderDone: boolean;
  completeLoader: () => void;
  aboutOpen: boolean;
  openAbout: () => void;
  closeAbout: () => void;
}

const noop = () => {};

export const AppShellContext = createContext<AppShellContextValue>({
  loaderDone: true,
  completeLoader: noop,
  aboutOpen: false,
  openAbout: noop,
  closeAbout: noop,
});

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
