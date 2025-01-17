interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface TradeStatusLogsProps {
  logs: TradeLog[];
}

import { ScrollArea } from "@/components/ui/scroll-area";

export function TradeStatusLogs({ logs }: TradeStatusLogsProps) {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`text-sm ${
              log.type === 'error' ? 'text-red-500' :
              log.type === 'success' ? 'text-green-500' :
              'text-gray-500'
            }`}
          >
            <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}