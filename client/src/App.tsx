import { ApolloProvider } from "@apollo/client/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { apolloClient } from "./lib/apollo";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Participants from "./pages/Participants";
import Achievements from "./pages/Achievements";
import WeeklyParticipants from "./pages/WeeklyParticipants";
import ApplicantManagement from "./pages/ApplicantManagement";

function ProtectedRoute({ component: Component }: { component: () => React.JSX.Element }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => React.JSX.Element }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/participants">
        <ProtectedRoute component={Participants} />
      </Route>
      <Route path="/achievements">
        <ProtectedRoute component={Achievements} />
      </Route>
      <Route path="/achievements/:challengeId">
        <ProtectedRoute component={WeeklyParticipants} />
      </Route>
      <Route path="/applicant-management">
        <ProtectedRoute component={ApplicantManagement} />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
