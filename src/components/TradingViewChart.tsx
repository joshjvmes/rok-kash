import { useEffect, useRef } from 'react';
import { Card } from './ui/card';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (container.current) {
        new window.TradingView.widget({
          container_id: 'tradingview_chart',
          width: '100%',
          height: '600',
          symbol: 'BINANCE:BTCUSDT',
          interval: '1D',
          timezone: 'exchange',
          theme: 'dark',
          style: '1',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
          studies: ['MASimple@tv-basicstudies'],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <Card className="p-4">
      <div id="tradingview_chart" ref={container} />
    </Card>
  );
};