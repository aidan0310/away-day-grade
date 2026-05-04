import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import LogMatch from "./pages/LogMatch";
import Stadiums from "./pages/Stadiums";
import StadiumDetail from "./pages/StadiumDetail";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { ClubTheme } from "@/components/ClubTheme";

const queryClient = new QueryClient();

const Protected = ({ children, requireTeam = true }: { children: JSX.Element; requireTeam?: boolean }) => {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireTeam && profile && !profile.supported_team && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const RedirectIfAuthed = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <ClubTheme />
          <Routes>
            <Route path="/auth" element={<RedirectIfAuthed><Auth /></RedirectIfAuthed>} />
            <Route path="/onboarding" element={<Protected requireTeam={false}><Onboarding /></Protected>} />
            <Route path="/" element={<Protected><Feed /></Protected>} />
            <Route path="/log" element={<Protected><LogMatch /></Protected>} />
            <Route path="/log/:id" element={<Protected><LogMatch /></Protected>} />
            <Route path="/stadiums" element={<Protected><Stadiums /></Protected>} />
            <Route path="/stadium/:id" element={<Protected><StadiumDetail /></Protected>} />
            <Route path="/leaderboards" element={<Protected><Leaderboards /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
<Route path="/user/:id" element={<Protected><UserProfile /></Protected>} />
<Route path="/search" element={<Protected><Search /></Protected>} />
<Route path="/profile/followers" element={<Protected><Followers /></Protected>} />
<Route path="/profile/following" element={<Protected><Following /></Protected>} />
<Route path="/profile/edit" element={<Protected><EditProfile /></Protected>} />
<Route path="/notifications" element={<Protected><Notifications /></Protected>} />
<Route path="/matches" element={<Protected><Matches /></Protected>} />
<Route path="/match/:key" element={<Protected><MatchDetail /></Protected>} />
<Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
