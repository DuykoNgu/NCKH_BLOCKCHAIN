import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./pages/Layout";
import Degrees from "./pages/Degrees";
import Verify from "./pages/Verify";
import Transactions from "./pages/Transactions";
import Students from "./pages/Students";
import Contracts from "./pages/Contracts";
import Settings from "./pages/Settings";
import Network from "./pages/Network";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TrongDongWatermark } from "./components/TrongDongPattern";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TrongDongWatermark className="bg-white fixed inset-0 -z-10" />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="degrees" element={<Degrees />} />
            <Route path="verify" element={<Verify />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="students" element={<Students />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="network" element={<Network />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
