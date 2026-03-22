import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './pages/Login/Login';
import UserDetails from './pages/UserDetails/UserDetails';
import DomainSelection from './pages/DomainSelection/DomainSelection';
import Questions from './pages/Questions/Questions';
import Success from './pages/Success/Success';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

import SplashScreen from "./components/SplashScreen";
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [splashMinTimePassed, setSplashMinTimePassed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const navigate = useNavigate();

  // Splash minimum time
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinTimePassed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Firebase auth check
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isReady = !authLoading && splashMinTimePassed;

  // Splash exit animation
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (showSplash) {
    return <SplashScreen finishLoading={isReady} />;
  }

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header className="app-header">
        <div className="app-logo-container" style={{ textDecoration: 'none' }}>
          <img src="/saelogo.png" alt="SAE Logo" className="app-logo" />
          <h1 className="app-title font-display font-bold">
            SAE <span className="text-primary app-title-span">AUDITION</span>
          </h1>
        </div>

        {user && (
          <div className="user-profile">
            <span className="user-email">{user.email}</span>
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
              alt="avatar"
              className="user-avatar"
            />
          </div>
        )}

        {/* ADMIN BUTTON */}
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* ROUTES */}
      <main>
        <Routes>
          <Route path="/" element={!user ? <Login /> : <Navigate to="/details" />} />
          <Route path="/details" element={user ? <UserDetails /> : <Navigate to="/" />} />
          <Route path="/domains" element={user ? <DomainSelection /> : <Navigate to="/" />} />
          <Route path="/questions" element={user ? <Questions /> : <Navigate to="/" />} />
          <Route path="/success" element={user ? <Success /> : <Navigate to="/" />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;