/**
 * Tracks whether the current JS runtime has completed its first boot.
 *
 * A full page reload resets this module, so the intro loader plays again.
 * Client-side navigation between routes does not reload modules, so returning
 * home from a case study never replays the loader.
 */
let booted = false;

export function markAppBooted(): void {
  booted = true;
}

export function hasBootedThisRuntime(): boolean {
  return booted;
}
