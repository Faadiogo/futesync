import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Matches from "@/pages/matches";
import CreateMatch from "@/pages/create-match";
import Social from "@/pages/social";
import Profile from "@/pages/profile";
import Navigation from "@/components/layout/navigation";
import Sidebar from "@/components/layout/sidebar";

function AuthenticatedRoutes() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Navigation />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/matches" component={Matches} />
          <Route path="/create-match" component={CreateMatch} />
          <Route path="/social" component={Social} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
