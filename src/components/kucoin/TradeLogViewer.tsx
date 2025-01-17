import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface TradeLogViewerProps {
  logs: TradeLog[];
}

export function TradeLogViewer({ logs }: TradeLogViewerProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Trade Status</h2>
      <ScrollArea className="h-[400px]">
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
    </Card>
  );
}