import React, { createContext, useContext, useState, useEffect } from "react";
import { lightTheme, darkTheme } from "../theme";

const ThemeContext = createContext(null);
const STORAGE_KEY = "dris_theme_mode";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(STORAGE_KEY) || "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    if (typeof document !== "undefined") {
      document.body.style.background = mode === "dark" ? darkTheme.bg : lightTheme.bg;
      document.body.style.transition = "background 0.2s ease";
    }
  }, [mode]);

  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
