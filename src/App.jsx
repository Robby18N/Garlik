import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';

import Login from '@/pages/Login';
import TodaysPatient from '@/pages/TodaysPatient';
import Registration from '@/pages/Registration';
import Screening from '@/pages/Screening';
import Records from '@/pages/Records';
import Activity from '@/pages/Activity';
import Billing from '@/pages/Billing';
import Reminders from '@/pages/Reminders';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import Prescription from '@/pages/Prescription';
import PageTransition from '@/components/page-transition';
import { RoleProvider, useRole } from '@/context/role-context';
import { PatientStatusProvider } from '@/context/patient-status-context';

// Gate for every screen except Login: bounce back to "/" when there's no
// authenticated account yet (fresh load, or after Logout), so the app can't
// be reached by just typing a URL — a real login is required first.
function RequireAuth({ children }) {
  const { isAuthenticated } = useRole();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

// Every route change (Login ↔ Today's Patient ↔ New Registration) crossfades
// via <PageTransition> instead of hard-cutting — the "Smart Animate" style
// transition applied app-wide. `mode="wait"` lets the leaving page finish
// its exit animation before the next one enters, so the two never overlap.
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route
          path="/patients"
          element={
            <PageTransition>
              <RequireAuth>
                <TodaysPatient />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/registration"
          element={
            <PageTransition>
              <RequireAuth>
                <Registration />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/screening"
          element={
            <PageTransition>
              <RequireAuth>
                <Screening />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/records"
          element={
            <PageTransition>
              <RequireAuth>
                <Records />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/activity"
          element={
            <PageTransition>
              <RequireAuth>
                <Activity />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/billing"
          element={
            <PageTransition>
              <RequireAuth>
                <Billing />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/reminders"
          element={
            <PageTransition>
              <RequireAuth>
                <Reminders />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/schedule"
          element={
            <PageTransition>
              <RequireAuth>
                <Schedule />
              </RequireAuth>
            </PageTransition>
          }
        />
        <Route
          path="/resep"
          element={
            <PageTransition>
              <RequireAuth>
                <Prescription />
              </RequireAuth>
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <PatientStatusProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <AnimatedRoutes />
        </BrowserRouter>
      </PatientStatusProvider>
    </RoleProvider>
  );
}
