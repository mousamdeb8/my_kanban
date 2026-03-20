// File: frontend/src/context/ThemeContext.jsx
// Action: REPLACE EXISTING FILE
// Change: Set default to light mode (dark = false)

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Changed from true to false - defaults to LIGHT mode now
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
    if (saved === "light") setDark(false);
  }, []);

  const toggle = () => {
    const newValue = !dark;
    setDark(newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}