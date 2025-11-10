import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Reminder from "./pages/Reminder";
import Tasks from "./pages/Tasks";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DeptAdminDashboard from "./pages/DeptAdminDashboard";
import ChallengePage from "./pages/Challenge";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireRegularUser>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/profile" element={<Profile />} />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute requireRegularUser>
                    <Tasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reminder" 
                element={
                  <ProtectedRoute requireRegularUser>
                    <Reminder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/challenge/:id" 
                element={
                  <ProtectedRoute requireRegularUser>
                    <ChallengePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dept-admin" 
                element={
                  <ProtectedRoute requireDeptAdmin>
                    <DeptAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/super-admin" 
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
