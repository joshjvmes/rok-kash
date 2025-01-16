import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface LogMessage {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

const CommandTerminal = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Override console methods to capture logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleInfo = console.info;

    const addLog = (message: any, type: 'info' | 'error' | 'success') => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, {
        timestamp,
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        type
      }]);
    };

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addLog(args[0], 'info');
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addLog(args[0], 'error');
    };

    console.info = (...args) => {
      originalConsoleInfo.apply(console, args);
      addLog(args[0], 'success');
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.info = originalConsoleInfo;
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  return (
    <Card className="bg-serenity-white shadow-lg border border-serenity-sky-light relative">
      {/* Fade overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-b from-serenity-white via-serenity-white/80 to-transparent" />
      
      <ScrollArea 
        ref={scrollAreaRef} 
        className="h-[200px] rounded-lg"
      >
        <div className="space-y-1 p-4 font-mono text-sm">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`
                ${log.type === 'error' ? 'text-trading-red' : ''}
                ${log.type === 'success' ? 'text-trading-green' : ''}
                ${log.type === 'info' ? 'text-serenity-mountain' : ''}
              `}
            >
              <span className="text-serenity-sky-dark">[{log.timestamp}]</span>{' '}
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default CommandTerminal;