import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="p-1.5 hover:opacity-60 transition-opacity relative"
    >
      <Sun
        className={`size-4 transition-all duration-300 ${
          isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
        strokeWidth={1.5}
      />
      <Moon
        className={`size-4 absolute inset-0 m-auto transition-all duration-300 ${
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
        }`}
        strokeWidth={1.5}
      />
    </button>
  );
}
