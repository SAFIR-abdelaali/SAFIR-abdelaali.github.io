/** Saves a visitor preference. If storage is blocked, the choice simply lasts for this page view. */
export function savePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}
