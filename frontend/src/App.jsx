import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  Activity, BarChart3, Bell, BookOpen, ChevronDown, FileText, Home, Leaf,
  LogOut, Menu, Moon, ScanLine, Sun, UserRound, X
} from "lucide-react";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";

import HomePage from "./pages/Home";
import Prediction from "./pages/Prediction";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";
import Diseases from "./pages/Diseases";
import DiseaseDetail from "./pages/DiseaseDetail";
import WeatherRisk from "./pages/WeatherRisk";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

function SplashScreen({ onComplete }) {
  const { t } = useLanguage();
  const ui = (key) => t(`ui.${key}`);
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 5000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="splash-screen" aria-label="Loading AgriVision AI">
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />
      <div className="splash-leaf splash-leaf-one">🍃</div>
      <div className="splash-leaf splash-leaf-two">🌿</div>
      <div className="splash-tomato">🍅</div>
      <div className="splash-brand">{ui("brand").toUpperCase()}</div>
      <p>{ui("tagline")}</p>
      <div className="splash-loader"><span /></div>
      <small>Preparing your field intelligence</small>
    </main>
  );
}

function LanguageSelector() {
  const { language, changeLanguage, languageNames, languages, mode, changeMode, t } = useLanguage();
  const ui = (key) => t(`ui.${key}`);

  return (
    <div className="topbar-controls">
      <label className="select-pill" title={ui("language")}>
        <span>🌐</span>
        <select value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={ui("language")}>
          {languages.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
        </select>
      </label>
      <label className="select-pill mode-pill" title={ui(mode === "farmer" ? "farmerMode" : "researchMode")}>
        <select value={mode} onChange={(event) => changeMode(event.target.value)} aria-label={ui("researchMode")}>
          <option value="farmer">{ui("farmerMode")}</option>
          <option value="research">{ui("researchMode")}</option>
        </select>
      </label>
    </div>
  );
}

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, mode, changeMode } = useLanguage();
  const ui = (key) => t(`ui.${key}`);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem("agrivision-theme") === "dark");

  const items = [
    { to: "/dashboard", label: ui("dashboard"), icon: Home },
    { to: "/prediction", label: ui("detect"), icon: ScanLine },
    { to: "/diseases", label: ui("diseaseLibrary"), icon: Leaf },
    { to: "/history", label: ui("history"), icon: BookOpen },
    { to: "/weather-risk", label: ui("analytics"), icon: BarChart3 },
    { to: "/history", label: ui("reports"), icon: FileText },
  ];
  const mobileItems = [
    { to: "/dashboard", label: ui("home"), icon: Home },
    { to: "/prediction", label: ui("detectDisease"), icon: ScanLine },
    { to: "/history", label: ui("history"), icon: BookOpen },
    { to: "/weather-risk", label: ui("insights"), icon: BarChart3 },
    { to: "/profile", label: ui("profile"), icon: UserRound },
  ];

  return (
      <section className={`app-main ${darkTheme ? "theme-dark" : ""}`}>
        <header className="topbar">
          <div className="app-brand">
            <Link to="/home" className="brand-lockup"><span className="brand-symbol"><Leaf size={21} /><i /></span><span>{ui("brand").replace(" AI", "")} <b>AI</b></span></Link>
          </div>
          <button className="mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? ui("close") : ui("openMenu")}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
          <nav className={`product-nav ${mobileOpen ? "product-nav-open" : ""}`} aria-label={ui("mainNavigation")}>
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={`${to}-${label}`} to={to} className={`product-nav-link ${location.pathname.startsWith(to) ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                <Icon size={16} /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="topbar-right">
            <span className="location-chip"><span className="online-dot" />{user?.location || "Hubballi"}</span>
            <button className="icon-button" aria-label={ui("notifications")}><Bell size={18} /><i /></button>
            <LanguageSelector />
            <div className="profile-menu-wrap">
              <button className="profile-chip" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                <span className="avatar">{(user?.name || "F").charAt(0).toUpperCase()}</span><span>{user?.name || "Farmer"}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="profile-dropdown">
                <Link to="/profile" onClick={() => setProfileOpen(false)}><UserRound size={16} />{ui("profile")}</Link>
                <button onClick={() => changeMode(mode === "farmer" ? "research" : "farmer")}><Activity size={16} />{ui(mode === "farmer" ? "switchResearch" : "switchFarmer")}</button>
                <button onClick={() => setDarkTheme((current) => { const next = !current; localStorage.setItem("agrivision-theme", next ? "dark" : "light"); return next; })}>{darkTheme ? <Sun size={16} /> : <Moon size={16} />}{ui(darkTheme ? "lightAppearance" : "darkAppearance")}</button>
                <button onClick={logout}><LogOut size={16} />{ui("logout")}</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="page-container">{children}</main>
        <nav className="mobile-bottom-nav" aria-label={ui("mobileNavigation")}>
          {mobileItems.map(({ to, icon: Icon, label }) => (
            <Link key={label} to={to} className={location.pathname.startsWith(to) ? "active" : ""}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </section>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  return user ? <AppShell>{children}</AppShell> : <Navigate to="/login" replace state={{ from: location }} />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/predict" element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
      <Route path="/prediction" element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/history/:id" element={<ProtectedRoute><HistoryDetail /></ProtectedRoute>} />
      <Route path="/diseases" element={<ProtectedRoute><Diseases /></ProtectedRoute>} />
      <Route path="/disease/:id" element={<ProtectedRoute><DiseaseDetail /></ProtectedRoute>} />
      <Route path="/diseases/:id" element={<ProtectedRoute><DiseaseDetail /></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><WeatherRisk /></ProtectedRoute>} />
      <Route path="/weather-risk" element={<ProtectedRoute><WeatherRisk /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <BrowserRouter>
      {showSplash ? <SplashScreen onComplete={() => setShowSplash(false)} /> : <AppRoutes />}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BrowserRouter>
  );
}
