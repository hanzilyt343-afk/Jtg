/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import Layout from "./components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalBackground } from "./components/GlobalBackground";
import { SystemUpdateListener } from "./components/SystemUpdateListener";
import { TutorialOverlay } from "./components/TutorialOverlay";

// Lazy loading components for better performance & fast loading
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ServerList = lazy(() => import("./pages/ServerList"));
const CreateServer = lazy(() => import("./pages/CreateServer"));
const ServerView = lazy(() => import("./pages/ServerView"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));

// Reusable Loading Spinner Component
const PageLoader = () => (
  <div className="h-[100dvh] w-full flex items-center justify-center bg-transparent text-white">
    <motion.div
      animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg shadow-indigo-500/20"
    />
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
};

// Animated Router Handler
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname.split("/")[1] || "root"} className="h-full w-full flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/servers" element={<ProtectedRoute><ServerList /></ProtectedRoute>} />
            <Route path="/servers/create" element={<ProtectedRoute><CreateServer /></ProtectedRoute>} />
            <Route path="/servers/:id/*" element={<ProtectedRoute><ServerView /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />

            {/* Catch-all Fallback (404 / Unknown Paths) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </AnimatePresence>
  );
};

// Tutorial Management Handler
const TutorialManager = () => {
  const { panelName, enableTutorial } = useSettings();
  const [showTutorial, setShowTutorial] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (enableTutorial === false || loading || !user || location.pathname === "/login") {
      setShowTutorial(false);
      return;
    }

    const isDev = process.env.NODE_ENV === "development";
    const tutorialKey = isDev ? `tutorialShown_dev_${user.id}` : `tutorialShown_prod_${user.id}`;
    const storage = isDev ? sessionStorage : localStorage;

    if (!storage.getItem(tutorialKey)) {
      setShowTutorial(true);
    }
  }, [user, loading, location.pathname, enableTutorial]);

  const handleTutorialComplete = () => {
    if (!user) return;
    const isDev = process.env.NODE_ENV === "development";
    const tutorialKey = isDev ? `tutorialShown_dev_${user.id}` : `tutorialShown_prod_${user.id}`;
    const storage = isDev ? sessionStorage : localStorage;

    storage.setItem(tutorialKey, "true");
    setShowTutorial(false);
  };

  if (!showTutorial) return null;

  return <TutorialOverlay onComplete={handleTutorialComplete} panelName={panelName} />;
};

// Main Application Entry
export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <SystemUpdateListener />
        <GlobalBackground />
        <Router>
          <AnimatedRoutes />
          <TutorialManager />
        </Router>
      </AuthProvider>
    </SettingsProvider>
  );
    }
  
