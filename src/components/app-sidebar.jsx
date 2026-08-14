import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  CalendarSearch,
  FileUser,
  Database,
  BriefcaseMedical,
  Activity,
  Banknote,
  BellRing,
  FlaskConical,
  Wallet,
  FileSpreadsheet,
  Settings2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRole } from '@/context/role-context';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Exact layer names/order from Figma's left nav rail, identical across
// screens (verified on nodes 469:3816 and 469:2768): Icon / calendar-search,
// Icon / file-user, Icon / database, Icon / briefcase-medical,
// Icon / banknote, Icon / bell-ring, Icon / flask-conical, Icon / wallet,
// Icon / file-spreadsheet, Icon / settings-2 — plus a grid icon and one
// unnamed "Activity"-style icon. `label` is what shows in each item's
// tooltip and `path` is where it routes once the screen is built.
const NAV_ITEMS = [
  { icon: LayoutGrid, key: 'grid', label: 'Dashboard' },
  { icon: CalendarSearch, key: 'patients', label: "Today's Patient", path: '/patients' },
  { icon: FileUser, key: 'records', label: 'Records', path: '/records' },
  { icon: Database, key: 'database', label: 'Database' },
  { icon: BriefcaseMedical, key: 'clinical', label: 'Clinical' },
  { icon: Activity, key: 'activity', label: 'Activity', path: '/activity' },
  { icon: Banknote, key: 'billing', label: 'Billing' },
  { icon: BellRing, key: 'reminders', label: 'Reminders' },
  { icon: FlaskConical, key: 'labs', label: 'Labs' },
  { icon: Wallet, key: 'wallet', label: 'Wallet' },
  { icon: FileSpreadsheet, key: 'reports', label: 'Reports' },
  { icon: Settings2, key: 'settings', label: 'Settings' },
];

// Per-role allowlist — anything not listed here simply isn't rendered.
// No partial/"view only" state anymore: if a role can't actually use a
// menu, it's left off the rail entirely instead of showing a locked icon.
// Receptionist keeps only the menus tiered as full-access in our UAM
// breakdown (Records, Activity, Billing, Reminders); Database, Labs,
// Wallet, Reports, Clinical, and Settings are all out of scope for now.
// Doctor and Admin aren't scoped yet beyond "full access" — narrow these
// as those roles get defined.
const ROLE_ACCESS = {
  Receptionist: ['grid', 'patients', 'records', 'activity', 'billing', 'reminders'],
  Doctor: NAV_ITEMS.map((item) => item.key),
  Admin: NAV_ITEMS.map((item) => item.key),
};

/**
 * Left icon nav rail shared by every dashboard screen. Role-aware: reads
 * the active role from context (set via the header's AccountMenu) and only
 * renders the menus that role can actually access, so switching roles
 * there updates the sidebar immediately without needing a page refresh.
 * @param {{ activeKey?: string, width?: number }} props
 */
export default function AppSidebar({ activeKey = 'patients', width = 60 }) {
  const { role } = useRole();
  const allowed = ROLE_ACCESS[role] ?? [];
  const visibleItems = NAV_ITEMS.filter((item) => allowed.includes(item.key));

  return (
    <aside
      style={{ width }}
      className="flex shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4"
    >
      <nav className="flex flex-col gap-3">
        {visibleItems.map(({ icon: Icon, key, label, path }) => {
          const isActive = key === activeKey;

          const button = (
            <button
              type="button"
              className={cn(
                'flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
                isActive && 'bg-green-600 text-white hover:bg-green-600 hover:text-white'
              )}
            >
              <Icon className="size-[18px]" />
            </button>
          );

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                {path ? (
                  <Link to={path} aria-label={label}>
                    {button}
                  </Link>
                ) : (
                  <span aria-label={label}>{button}</span>
                )}
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
