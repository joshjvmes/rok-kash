import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import CommandTerminal from "@/components/CommandTerminal";
import { PhantomWallet } from "@/components/PhantomWallet";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import BybitTest from "./pages/exchanges/BybitTest";
import CoinbaseTest from "./pages/exchanges/CoinbaseTest";
import KrakenTest from "./pages/exchanges/KrakenTest";
import BinanceTest from "./pages/exchanges/BinanceTest";
import KucoinTest from "./pages/exchanges/KucoinTest";
import OkxTest from "./pages/exchanges/OkxTest";
import Rebalance from "./pages/protocols/rebalance";
import ClosePositions from "./pages/protocols/close-positions";
import Withdraw from "./pages/protocols/withdraw";
import Pure from "./pages/algorithms/pure";
import Triangle from "./pages/algorithms/triangle";
import Pools from "./pages/algorithms/pools";
import Statistical from "./pages/algorithms/statistical";
import Counter from "./pages/algorithms/counter";
import SemiAutomatic from "./pages/algorithms/semi-automatic";
import Balances from "./pages/Balances";
import ProfitLoss from "./pages/ProfitLoss";
import TradeHistory from "./pages/TradeHistory";
import EC2Monitor from "./pages/aws/EC2Monitor";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Layout component to prevent re-rendering of common UI elements
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
                KASH $ROK
              </h1>
              <PhantomWallet />
            </div>
            <CommandTerminal />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  // Set up Solana wallet configuration - moved outside of routes
  const network = 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/aws/ec2" element={<EC2Monitor />} />
                            <Route path="/exchanges/bybit" element={<BybitTest />} />
                            <Route path="/exchanges/coinbase" element={<CoinbaseTest />} />
                            <Route path="/exchanges/kraken" element={<KrakenTest />} />
                            <Route path="/exchanges/binance" element={<BinanceTest />} />
                            <Route path="/exchanges/kucoin" element={<KucoinTest />} />
                            <Route path="/exchanges/okx" element={<OkxTest />} />
                            <Route path="/protocols/rebalance" element={<Rebalance />} />
                            <Route path="/protocols/close-positions" element={<ClosePositions />} />
                            <Route path="/protocols/withdraw" element={<Withdraw />} />
                            <Route path="/algorithms/pure" element={<Pure />} />
                            <Route path="/algorithms/triangle" element={<Triangle />} />
                            <Route path="/algorithms/pools" element={<Pools />} />
                            <Route path="/algorithms/statistical" element={<Statistical />} />
                            <Route path="/algorithms/counter" element={<Counter />} />
                            <Route path="/algorithms/semi-automatic" element={<SemiAutomatic />} />
                            <Route path="/balances" element={<Balances />} />
                            <Route path="/profit-loss" element={<ProfitLoss />} />
                            <Route path="/trade-history" element={<TradeHistory />} />
                          </Routes>
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
};

export default App;