import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import CommandTerminal from "@/components/CommandTerminal";
import { PhantomWallet } from "@/components/PhantomWallet";
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

const queryClient = new QueryClient();

function getLibrary(provider: any) {
  return new Web3Provider(provider);
}

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <QueryClientProvider client={queryClient}>
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
                            <Routes>
                              <Route path="/" element={<Index />} />
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
                          </div>
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Web3ReactProvider>
  );
};

export default App;
