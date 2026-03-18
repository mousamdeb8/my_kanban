// File: frontend/src/App.jsx
// Action: REPLACE EXISTING FILE

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider }        from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import Projects       from "./pages/Projects";
import Layout         from "./components/Layout";
import Summary        from "./pages/Summary";
import Home           from "./pages/Home";
import Timeline       from "./pages/Timeline";
import Settings       from "./pages/Settings";
import TeamMembers    from "./pages/TeamMembers";
import AdminAccounts from "./pages/AdminAccounts";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  return user ? children : <Navigate to="/login" replace/>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/projects" replace/>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={<PublicRoute><Login/></PublicRoute>}/>
      <Route path="/register"        element={<PublicRoute><Register/></PublicRoute>}/>
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword/></PublicRoute>}/>
      <Route path="/reset-password"  element={<ResetPassword/>}/>

      {/* Top-level private routes */}
      <Route path="/" element={<PrivateRoute><Navigate to="/projects" replace/></PrivateRoute>}/>
      <Route path="/projects" element={<PrivateRoute><Projects/></PrivateRoute>}/>
      
      {/* Gamification routes (global) */}
      <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

      {/* Project-specific routes */}
      <Route path="/projects/:projectId" element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index element={<Navigate to="summary" replace/>}/>
        <Route path="summary"  element={<Summary/>}/>
        <Route path="board"    element={<Home/>}/>
        <Route path="timeline" element={<Timeline/>}/>
        <Route path="team"     element={<TeamMembers/>}/>
        <Route path="settings" element={<Settings/>}/>
        <Route path="accounts" element={<AdminAccounts/>}/>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Toaster position="top-right"/>
          <BrowserRouter>
            <AppRoutes/>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}