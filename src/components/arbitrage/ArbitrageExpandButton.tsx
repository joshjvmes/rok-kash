import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ArbitrageExpandButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function ArbitrageExpandButton({ isExpanded, onToggle }: ArbitrageExpandButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
    >
      {isExpanded ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </Button>
  );
}