import { createContext, useContext, useState } from 'react';

// Single source of truth for "who's logged in as what" — shared between
// Login (which authenticates and sets the account), the header's
// AccountMenu (which can also quick-switch it), and AppSidebar (which reads
// the role to decide what's hidden/restricted). Kept as plain context
// instead of a prop drilled through every page since all three consumers
// can sit anywhere in the tree relative to each other.
export const ROLES = ['Receptionist', 'Doctor', 'Admin'];

// Which doctor the "Doctor" role is currently acting as — needed anywhere
// data has to be scoped to "this doctor's own patients" (Today's Patient's
// table/summary cards, remark chat sender identity, etc). Only meaningful
// when role === 'Doctor'; Receptionist/Admin ignore it.
export const DOCTORS = ['drg. SM', 'drg. AN', 'drg. RF'];

// The five access accounts requested for login + the header's account
// switcher: one Receptionist account, one Admin account (full access to
// every menu), and one account PER doctor (so each doctor logs in as
// themselves rather than picking a name after logging in as a generic
// "Doctor"). `username` is what's shown/selected on the Login dropdown and
// used to look the account up; every account shares the same mock
// password for this demo.
export const ACCOUNTS = [
  { username: 'receptionist', label: 'Receptionist', role: 'Receptionist', doctorName: null },
  { username: 'drg.an', label: 'drg. AN', role: 'Doctor', doctorName: 'drg. AN' },
  { username: 'drg.sm', label: 'drg. SM', role: 'Doctor', doctorName: 'drg. SM' },
  { username: 'drg.rf', label: 'drg. RF', role: 'Doctor', doctorName: 'drg. RF' },
  { username: 'admin', label: 'Admin', role: 'Admin', doctorName: null },
];

export const ACCOUNT_PASSWORD = '123';

export function findAccount(username) {
  return ACCOUNTS.find((a) => a.username === username) ?? null;
}

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('Receptionist');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Applies an account's role + doctorName together (used by both the real
  // Login form and the header's quick-switch dropdown, so the two never
  // drift out of sync with each other).
  function applyAccount(nextAccount) {
    setAccount(nextAccount);
    setRole(nextAccount.role);
    if (nextAccount.doctorName) setDoctorName(nextAccount.doctorName);
  }

  // Validates username/password against the mock ACCOUNTS list. Returns
  // the matched account on success (and marks the session authenticated),
  // or null on a bad username/password so the Login form can show an error.
  function login(username, password) {
    const matched = findAccount(username);
    if (!matched || password !== ACCOUNT_PASSWORD) return null;
    applyAccount(matched);
    setIsAuthenticated(true);
    return matched;
  }

  function logout() {
    setIsAuthenticated(false);
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        doctorName,
        setDoctorName,
        account,
        applyAccount,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}
