import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export type LogEntry = {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'error' | 'success';
};

const CommandTerminal = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog(args.join(' '), 'info');
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog(args.join(' '), 'error');
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog(args.join(' '), 'info');
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        message,
        timestamp: new Date(),
        type
      }
    ].slice(-100)); // Keep only last 100 logs
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="bg-black border-gray-800 p-4 font-mono text-sm">
      <ScrollArea className="h-[200px] w-full" ref={scrollRef}>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start space-x-2 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-gray-300'
              }`}
            >
              <span className="text-gray-500 min-w-[70px]">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default CommandTerminal;