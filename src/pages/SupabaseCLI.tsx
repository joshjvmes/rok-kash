import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SupabaseCLI = () => {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCommand = async () => {
    if (!command.trim()) return;

    setIsLoading(true);
    try {
      // Add command to output immediately
      setOutput(prev => [...prev, `$ ${command}`]);

      const { data, error } = await supabase.functions.invoke('supabase-cli', {
        body: { command }
      });

      if (error) throw error;

      // Format and display the output
      let formattedOutput: string[] = [];
      if (typeof data.output === 'string') {
        formattedOutput = data.output.split('\n');
      } else {
        formattedOutput = [JSON.stringify(data.output, null, 2)]
          .flatMap(str => str.split('\n'))
          .map(line => line.trim());
      }
      
      setOutput(prev => [...prev, ...formattedOutput]);

      toast({
        title: "Command executed",
        description: data.error ? "Command completed with errors" : "Command completed successfully",
        variant: data.error ? "destructive" : "default",
      });
    } catch (error) {
      console.error('CLI error:', error);
      setOutput(prev => [...prev, `Error: ${error.message}`]);
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCommand(""); // Clear the input after execution
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCommand();
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
              onKeyPress={handleKeyPress}
              placeholder="Enter Supabase CLI command... (e.g. functions list)"
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleCommand} 
              disabled={isLoading}
            >
              {isLoading ? "Executing..." : "Execute"}
            </Button>
          </div>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-2 font-mono text-sm">
              {output.map((line, index) => (
                <div 
                  key={index} 
                  className={`${
                    line.startsWith('$') 
                      ? 'text-blue-500 font-bold' 
                      : line.startsWith('Error:')
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {line}
                </div>
              ))}
              {isLoading && (
                <div className="text-muted-foreground animate-pulse">
                  Executing command...
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};

export default SupabaseCLI;