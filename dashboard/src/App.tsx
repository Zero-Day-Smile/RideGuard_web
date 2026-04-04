import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import RiderDashboard from "./pages/RiderDashboard.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Contact from "./pages/Contact.tsx";
import PolicyManagement from "./pages/PolicyManagement.tsx";
import PremiumLab from "./pages/PremiumLab.tsx";
import ClaimsManagement from "./pages/ClaimsManagement.tsx";
import ManageUsers from "./pages/ManageUsers.tsx";
import Settings from "./pages/Settings.tsx";
import AdminFraudCenter from "./pages/AdminFraudCenter.tsx";
import AdminTriggerOps from "./pages/AdminTriggerOps.tsx";
import AdminClaimsOps from "./pages/AdminClaimsOps.tsx";
import AdminModelOps from "./pages/AdminModelOps.tsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.tsx";
import { DashboardRedirect, ProtectedRoute } from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const routerBase = import.meta.env.BASE_URL || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBase}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/policy-management" element={<PolicyManagement />} />
            <Route path="/premium-lab" element={<PremiumLab />} />
            <Route path="/claims" element={<ClaimsManagement />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/admin/fraud-center" element={<AdminFraudCenter />} />
            <Route path="/admin/trigger-ops" element={<AdminTriggerOps />} />
            <Route path="/admin/claims-ops" element={<AdminClaimsOps />} />
            <Route path="/admin/model-ops" element={<AdminModelOps />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["rider"]} />}>
            <Route path="/rider/dashboard" element={<RiderDashboard />} />
          </Route>
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
