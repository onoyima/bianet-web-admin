import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminKyc from "@/pages/admin/kyc";
import AdminUsers from "@/pages/admin/users";
import AdminLogs from "@/pages/admin/logs";
import AdminEscrow from "@/pages/admin/escrow";
import AdminSeedListings from "@/pages/admin/seed-listings";
import AdminBartarListings from "@/pages/admin/bartar-listings";
import AdminEducationalContent from "@/pages/admin/educational-content";
import AdminLogistics from "@/pages/admin/logistics";
import AdminVendors from "@/pages/admin/vendors";
import AdminEnterprises from "@/pages/admin/enterprises";
import AdminOrderManagement from "@/pages/admin/orders";
import AdminPayments from "@/pages/admin/payments";
import AdminDeals from "@/pages/admin/deals";
import AdminPriceFeed from "@/pages/admin/price-feed";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminNotifications from "@/pages/admin/notifications";
import AdminRoles from "@/pages/admin/roles";
import AdminSettings from "@/pages/admin/settings";
import Profile from "@/pages/profile";
import OpsDashboard from "@/pages/operations/Dashboard";
import OpsUsers from "@/pages/operations/Users";
import OpsOrders from "@/pages/operations/Orders";
import OpsFraudReview from "@/pages/operations/FraudReview";
import OpsAnalytics from "@/pages/operations/Analytics";
import SupportDashboard from "@/pages/support/Dashboard";
import SupportTickets from "@/pages/support/Tickets";
import SupportDisputes from "@/pages/support/Disputes";
import SupportUserLookup from "@/pages/support/UserLookup";
import AIDashboard from "@/pages/ai-control/Dashboard";
import AIModeration from "@/pages/ai-control/Moderation";
import AIModels from "@/pages/ai-control/Models";
import AITrainingData from "@/pages/ai-control/TrainingData";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Redirect } from "wouter";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/kyc" component={AdminKyc} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/logs" component={AdminLogs} />
        <Route path="/admin/escrow" component={AdminEscrow} />
        <Route path="/admin/seed-listings" component={AdminSeedListings} />
        <Route path="/admin/bartar-listings" component={AdminBartarListings} />
        <Route path="/admin/educational-content" component={AdminEducationalContent} />
        <Route path="/admin/logistics" component={AdminLogistics} />
        <Route path="/admin/vendors" component={AdminVendors} />
        <Route path="/admin/enterprises" component={AdminEnterprises} />
        <Route path="/admin/orders" component={AdminOrderManagement} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/deals" component={AdminDeals} />
        <Route path="/admin/price-feed" component={AdminPriceFeed} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/roles" component={AdminRoles} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/profile" component={Profile} />
        <Route path="/operations" component={OpsDashboard} />
        <Route path="/operations/users" component={OpsUsers} />
        <Route path="/operations/orders" component={OpsOrders} />
        <Route path="/operations/fraud-review" component={OpsFraudReview} />
        <Route path="/operations/analytics" component={OpsAnalytics} />
        <Route path="/support" component={SupportDashboard} />
        <Route path="/support/tickets" component={SupportTickets} />
        <Route path="/support/disputes" component={SupportDisputes} />
        <Route path="/support/user-lookup" component={SupportUserLookup} />
        <Route path="/ai-control" component={AIDashboard} />
        <Route path="/ai-control/moderation" component={AIModeration} />
        <Route path="/ai-control/models" component={AIModels} />
        <Route path="/ai-control/training-data" component={AITrainingData} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={ProtectedRoutes} />
      <Route path="/admin/*?" component={ProtectedRoutes} />
      <Route path="/profile/*?" component={ProtectedRoutes} />
      <Route path="/operations/*?" component={ProtectedRoutes} />
      <Route path="/support/*?" component={ProtectedRoutes} />
      <Route path="/ai-control/*?" component={ProtectedRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AuthProvider>
                <Router />
              </AuthProvider>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
