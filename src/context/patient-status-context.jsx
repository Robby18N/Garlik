import { createContext, useContext, useRef, useState, useCallback } from 'react';

// Shared "clinical status per patient" state, lifted out of Today's Patient
// so other pages can react to it too. The concrete case that needs this:
// when a doctor marks a patient Complete on Today's Patient, their
// still-unpaid invoice has to surface at the top of Billing immediately —
// that can't happen if each page only kept its own local copy of status.
// Keyed by patient id (matches the `P-0001` style id already used for
// search/mrn matching across the app).
//
// `completedOrder` records *when* each patient most recently became
// Complete as an ever-incrementing sequence number (not a wall-clock
// timestamp) purely so Billing can sort the newest completions above
// older ones — plain relative ordering is all that's needed here.
const PatientStatusContext = createContext(null);

export function PatientStatusProvider({ children }) {
  const [statusOverrides, setStatusOverrides] = useState({});
  const [completedOrder, setCompletedOrder] = useState({});
  const completedSeqRef = useRef(0);

  const setStatus = useCallback((patientId, status) => {
    setStatusOverrides((prev) => ({ ...prev, [patientId]: status }));
    if (status === 'Complete') {
      completedSeqRef.current += 1;
      const seq = completedSeqRef.current;
      setCompletedOrder((prev) => ({ ...prev, [patientId]: seq }));
    }
  }, []);

  return (
    <PatientStatusContext.Provider value={{ statusOverrides, completedOrder, setStatus }}>
      {children}
    </PatientStatusContext.Provider>
  );
}

export function usePatientStatus() {
  const ctx = useContext(PatientStatusContext);
  if (!ctx) {
    throw new Error('usePatientStatus must be used within a PatientStatusProvider');
  }
  return ctx;
}
