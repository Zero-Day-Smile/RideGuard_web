import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SplashScreen from "./pages/SplashScreen";
import RiderAuthScreen from "./pages/RiderAuthScreen";
import RiderHomeScreen from "./pages/RiderHomeScreen";
import RiderPolicyScreen from "./pages/RiderPolicyScreen";
import RiderPremiumScreen from "./pages/RiderPremiumScreen";
import RiderClaimsScreen from "./pages/RiderClaimsScreen";
import DeliveryPartnersScreen from "./pages/DeliveryPartnersScreen";
import SettingsScreen from "./pages/SettingsScreen";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/auth" element={<RiderAuthScreen />} />
          <Route element={<RequireAuth />}> 
            <Route element={<AppLayout />}> 
              <Route path="/home" element={<RiderHomeScreen />} />
              <Route path="/policy" element={<RiderPolicyScreen />} />
              <Route path="/premium" element={<RiderPremiumScreen />} />
              <Route path="/claims" element={<RiderClaimsScreen />} />
              <Route path="/partners" element={<DeliveryPartnersScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
