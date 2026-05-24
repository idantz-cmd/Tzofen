import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FloatingParticles } from "./components/animations/FloatingParticles";
import { FootballBackground } from "./components/animations/FootballBackground";
import { BottomNav } from "./components/layout/BottomNav";
import { PWAPrompts } from "./components/PWAPrompts";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ChatAssistant from "./pages/ChatAssistant";
import Login from "./pages/Login";
import Standings from "./pages/Standings";
import UserChat from "./pages/UserChat";
import AIPrediction from "./pages/AIPrediction";
import News from "./pages/News";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/matches"} component={Matches} />
      <Route path={"/leaderboard"} component={Leaderboard} />
      <Route path={"/standings"} component={Standings} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/chat"} component={ChatAssistant} />
      <Route path={"/user-chat"} component={UserChat} />
      <Route path={"/ai-prediction"} component={AIPrediction} />
      <Route path={"/news"} component={News} />
      <Route path={"/login"} component={Login} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <FloatingParticles />
          <FootballBackground />
          <div className="mesh-orb-3" aria-hidden="true" />
          <Toaster />
          <PWAPrompts />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Router />
            </div>
            <div className="md:hidden sticky bottom-0 z-50">
              <BottomNav />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
