import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ArbitrageExecuteButtonProps {
  isExecuting: boolean;
  onExecute: () => void;
}

export function ArbitrageExecuteButton({ isExecuting, onExecute }: ArbitrageExecuteButtonProps) {
  return (
    <Button
      variant="outline"
      className="ml-2"
      onClick={onExecute}
      disabled={isExecuting}
    >
      {isExecuting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        'Execute'
      )}
    </Button>
  );
}