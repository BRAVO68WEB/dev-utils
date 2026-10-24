export const THEME_KEY = "dev-utils:theme";
export type ThemeChoice = "system" | "light" | "dracula";

export function readThemeChoice(): ThemeChoice {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "dracula") return "dracula";
  if (stored === "light" || stored === "system") return stored;
  return "system";
}

export function themeLabel(choice: ThemeChoice) {
  if (choice === "dracula") return "Dracula";
  if (choice === "light") return "Light";
  return "System";
}

export function applyTheme(choice: ThemeChoice) {
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  localStorage.setItem(THEME_KEY, choice);
}

const themeListeners = new Set<() => void>();

export function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  return () => themeListeners.delete(onChange);
}

export function emitTheme() {
  for (const listener of themeListeners) listener();
}

export function nextTheme(choice: ThemeChoice): ThemeChoice {
  if (choice === "system") return "light";
  if (choice === "light") return "dracula";
  return "system";
}
