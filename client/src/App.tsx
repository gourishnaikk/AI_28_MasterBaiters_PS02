import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeProvider";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import { useEffect, useState } from "react";
import { createHashHistory } from "history";

// Create hash-based history for GitHub Pages routing
const hashHistory = createHashHistory();

// Custom hook for wouter to use hash-based routing
const useHashLocation = () => {
  const [location, setLocation] = useState(
    window.location.hash.replace(/^#/, "") || "/"
  );

  useEffect(() => {
    const handleHashChange = () => {
      setLocation(window.location.hash.replace(/^#/, "") || "/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (to) => {
    window.location.hash = to;
  };

  return [location, navigate];
};

// Custom router for GitHub Pages
const GithubPagesRouter = (props) => (
  <WouterRouter hook={useHashLocation} {...props} />
);

function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // For GitHub Pages, we'll use a simplified mock authentication
    // Check localStorage for remembered session
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (credentials) => {
    // Mock authentication for GitHub Pages
    if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
      localStorage.setItem('isLoggedIn', 'true');
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Use demo@example.com/demo123' };
  };

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? 
          <DashboardPage /> : 
          <LoginPage setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />}
      </Route>
      <Route path="/dashboard">
        {isAuthenticated ? 
          <DashboardPage /> : 
          <LoginPage setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GithubPagesRouter>
          <AppRouter />
        </GithubPagesRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
