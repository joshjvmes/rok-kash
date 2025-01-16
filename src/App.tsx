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
import Index from "./pages/Index";
import Login from "./pages/Login";
import BybitTest from "./pages/exchanges/BybitTest";
import CoinbaseTest from "./pages/exchanges/CoinbaseTest";
import KrakenTest from "./pages/exchanges/KrakenTest";
import BinanceTest from "./pages/exchanges/BinanceTest";
import KucoinTest from "./pages/exchanges/KucoinTest";
import OkxTest from "./pages/exchanges/OkxTest";

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
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
                        <div className="flex flex-col items-center space-y-4">
                          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
                            KASH $ROK
                          </h1>
                          <CommandTerminal />
                        </div>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/exchanges/bybit" element={<BybitTest />} />
                          <Route path="/exchanges/coinbase" element={<CoinbaseTest />} />
                          <Route path="/exchanges/kraken" element={<KrakenTest />} />
                          <Route path="/exchanges/binance" element={<BinanceTest />} />
                          <Route path="/exchanges/kucoin" element={<KucoinTest />} />
                          <Route path="/exchanges/okx" element={<OkxTest />} />
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
);

export default App;