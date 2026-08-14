import { createContext, useContext, useState } from 'react';

// Single source of truth for "who's logged in as what" — shared between the
// header's AccountMenu (which sets the role) and AppSidebar (which reads it
// to decide what's hidden/restricted). Kept as plain context instead of a
// prop drilled through every page since both consumers can sit anywhere in
// the tree relative to each other.
export const ROLES = ['Receptionist', 'Doctor', 'Admin'];

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('Receptionist');
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}
