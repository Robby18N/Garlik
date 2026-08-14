import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';

import Login from '@/pages/Login';
import TodaysPatient from '@/pages/TodaysPatient';
import Registration from '@/pages/Registration';
import PageTransition from '@/components/page-transition';

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
        <Route path="/patients" element={<PageTransition><TodaysPatient /></PageTransition>} />
        <Route path="/registration" element={<PageTransition><Registration /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
