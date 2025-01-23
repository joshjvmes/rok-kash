import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const SupabaseCLI = () => {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const { toast } = useToast();

  const handleCommand = async () => {
    try {
      // For now, we'll just simulate CLI output
      // In a real implementation, this would connect to a Supabase Edge Function
      setOutput(prev => [...prev, `$ ${command}`, "Executing command..."]);
      toast({
        title: "Command executed",
        description: "Check the output below",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter Supabase CLI command..."
              className="flex-1"
            />
            <Button onClick={handleCommand}>Execute</Button>
          </div>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-2 font-mono text-sm">
              {output.map((line, index) => (
                <div key={index} className="text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};

export default SupabaseCLI;