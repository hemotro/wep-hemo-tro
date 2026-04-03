import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Live from "./pages/Live";
import Search from "./pages/Search";
import Account from "./pages/Account";
import SeriesDetail from "./pages/SeriesDetail";
import EpisodePlayer from "./pages/EpisodePlayer";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import PasswordResetCode from "./pages/PasswordResetCode";
import BottomNav from "./components/BottomNav";

import { Notifications, useNotifications } from "./components/Notifications";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      {/* Handle reset-password with or without query params */}
      <Route path={"/reset-password*"} component={ResetPassword} />
      <Route path={"/reset-password-code"} component={PasswordResetCode} />
      <Route path={"/live"} component={Live} />
      <Route path={"/search"} component={Search} />
      <Route path={"/account"} component={Account} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/series/:id"} component={SeriesDetail} />
      <Route path={"/episode/:seriesId/:episodeNumber"} component={EpisodePlayer} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { notifications, removeNotification } = useNotifications();
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Notifications notifications={notifications} onRemove={removeNotification} />
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <main className="flex-1 flex flex-col">
              <Router />
            </main>
            <BottomNav />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
