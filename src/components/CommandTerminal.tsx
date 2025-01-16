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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="bg-black text-green-400 font-mono text-sm p-4">
      <ScrollArea className="h-[200px]" ref={scrollRef}>
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'info' ? 'text-blue-400' : ''}
              `}
            >
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default CommandTerminal;