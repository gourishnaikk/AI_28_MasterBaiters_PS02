import { useTheme } from "@/context/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  return (
    <div className="flex items-center">
      <span className="mr-2 text-sm text-muted-foreground">
        <Sun className="h-5 w-5" />
      </span>
      <div className="relative inline-block w-10 mr-2 align-middle select-none">
        <input 
          type="checkbox" 
          id="theme-toggle" 
          checked={theme === "dark"}
          onChange={toggleTheme}
          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in border-accent"
        />
        <label 
          htmlFor="theme-toggle" 
          className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in bg-accent"
        />
      </div>
      <span className="text-sm text-muted-foreground">
        <Moon className="h-5 w-5" />
      </span>
    </div>
  );
}

export default ThemeToggle;
