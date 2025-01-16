import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Paintbrush } from "lucide-react";

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<'default' | 'serenity'>('default');

  const toggleTheme = () => {
    const newTheme = theme === 'default' ? 'serenity' : 'default';
    setTheme(newTheme);
    
    // Apply theme classes to the root element
    const root = document.documentElement;
    if (newTheme === 'serenity') {
      root.style.setProperty('--background', '210 100% 98%'); // Light blue-white
      root.style.setProperty('--foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--card', '195 100% 95%'); // Sky light
      root.style.setProperty('--card-foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--primary', '195 71% 73%'); // Sky blue
      root.style.setProperty('--primary-foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--secondary', '146 25% 66%'); // Grass light
      root.style.setProperty('--secondary-foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--muted', '210 40% 96%'); // Light gray-blue
      root.style.setProperty('--muted-foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--accent', '195 71% 73%'); // Sky blue
      root.style.setProperty('--accent-foreground', '200 33% 36%'); // Mountain blue
      root.style.setProperty('--border', '195 71% 73%'); // Sky blue
      root.style.setProperty('--input', '210 40% 96%'); // Light gray-blue
      root.style.setProperty('--ring', '195 71% 73%'); // Sky blue
    } else {
      // Reset to default dark theme
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
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`fixed bottom-4 right-4 z-50 ${
        theme === 'serenity' ? 'bg-serenity-sky-light text-serenity-mountain' : ''
      }`}
    >
      <Paintbrush className="h-4 w-4" />
    </Button>
  );
};