import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Paintbrush } from "lucide-react";

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<'default' | 'serenity'>('serenity');

  const toggleTheme = () => {
    const newTheme = theme === 'default' ? 'serenity' : 'default';
    setTheme(newTheme);
    
    // Apply theme classes to the root element
    const root = document.documentElement;
    if (newTheme === 'serenity') {
      root.style.setProperty('--background', '210 100% 98%');
      root.style.setProperty('--foreground', '200 33% 36%');
      root.style.setProperty('--card', '195 100% 95%');
      root.style.setProperty('--card-foreground', '200 33% 36%');
      root.style.setProperty('--primary', '195 71% 73%');
      root.style.setProperty('--primary-foreground', '200 33% 36%');
      root.style.setProperty('--secondary', '146 25% 66%');
      root.style.setProperty('--secondary-foreground', '200 33% 36%');
      root.style.setProperty('--muted', '210 40% 96%');
      root.style.setProperty('--muted-foreground', '200 33% 36%');
      root.style.setProperty('--accent', '195 71% 73%');
      root.style.setProperty('--accent-foreground', '200 33% 36%');
      root.style.setProperty('--border', '195 71% 73%');
      root.style.setProperty('--input', '210 40% 96%');
      root.style.setProperty('--ring', '195 71% 73%');
    } else {
      root.style.setProperty('--background', '222.2 84% 4.9%');
      root.style.setProperty('--foreground', '210 40% 98%');
      root.style.setProperty('--card', '222.2 84% 4.9%');
      root.style.setProperty('--card-foreground', '210 40% 98%');
      root.style.setProperty('--primary', '210 40% 98%');
      root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
      root.style.setProperty('--secondary', '217.2 32.6% 17.5%');
      root.style.setProperty('--secondary-foreground', '210 40% 98%');
      root.style.setProperty('--muted', '217.2 32.6% 17.5%');
      root.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
      root.style.setProperty('--accent', '217.2 32.6% 17.5%');
      root.style.setProperty('--accent-foreground', '210 40% 98%');
      root.style.setProperty('--border', '217.2 32.6% 17.5%');
      root.style.setProperty('--input', '217.2 32.6% 17.5%');
      root.style.setProperty('--ring', '212.7 26.8% 83.9%');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="hover:bg-rokcat-purple/10"
    >
      <Paintbrush className="h-5 w-5" />
    </Button>
  );
};