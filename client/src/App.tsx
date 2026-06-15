import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { CategoryBackground } from "./components/layout/CategoryBackground";
import { BottomNav } from "./components/layout/BottomNav";
import { PWAPrompts } from "./components/PWAPrompts";

const Home = lazy(() => import("./pages/Home"));
const Matches = lazy(() => import("./pages/Matches"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ChatAssistant = lazy(() => import("./pages/ChatAssistant"));
const Login = lazy(() => import("./pages/Login"));
const Standings = lazy(() => import("./pages/Standings"));
const UserChat = lazy(() => import("./pages/UserChat"));
const AIPrediction = lazy(() => import("./pages/AIPrediction"));
const News = lazy(() => import("./pages/News"));
const Cup = lazy(() => import("./pages/Cup"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<AppLoader />}>
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
        <Route path={"/cup"} component={Cup} />
        <Route path={"/login"} component={Login} />
        <Route path={"/pricing"} component={Pricing} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={false}>
        <CategoryProvider>
          <TooltipProvider>
            <CategoryBackground />
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
        </CategoryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
