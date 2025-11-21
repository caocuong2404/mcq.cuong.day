/**
 * Tauri environment detection and helpers
 */

export const isTauri = () => {
  return '__TAURI_INTERNALS__' in window
}
