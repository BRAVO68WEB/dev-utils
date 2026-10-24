"use client";

import { useEffect, useState } from "react";

export function useResolvedTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const choice = root.dataset.theme;
      if (choice === "light") setTheme("light");
      else if (choice === "dracula" || choice === "dark") setTheme("dark");
      else setTheme(query.matches ? "dark" : "light");
    };
    read();
    query.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      query.removeEventListener("change", read);
      observer.disconnect();
    };
  }, []);

  return theme;
}
