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

// Exact layer names/order from Figma's left nav rail, identical across
// screens (verified on nodes 469:3816 and 469:2768): Icon / calendar-search,
// Icon / file-user, Icon / database, Icon / briefcase-medical,
// Icon / banknote, Icon / bell-ring, Icon / flask-conical, Icon / wallet,
// Icon / file-spreadsheet, Icon / settings-2 — plus a grid icon and one
// unnamed "Activity"-style icon.
const NAV_ITEMS = [
  { icon: LayoutGrid, key: 'grid' },
  { icon: CalendarSearch, key: 'patients' },
  { icon: FileUser, key: 'records' },
  { icon: Database, key: 'database' },
  { icon: BriefcaseMedical, key: 'clinical' },
  { icon: Activity, key: 'activity' },
  { icon: Banknote, key: 'billing' },
  { icon: BellRing, key: 'reminders' },
  { icon: FlaskConical, key: 'labs' },
  { icon: Wallet, key: 'wallet' },
  { icon: FileSpreadsheet, key: 'reports' },
  { icon: Settings2, key: 'settings' },
];

/**
 * Left icon nav rail shared by every dashboard screen.
 * @param {{ activeKey?: string, width?: number }} props
 */
export default function AppSidebar({ activeKey = 'patients', width = 60 }) {
  return (
    <aside
      style={{ width }}
      className="flex shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4"
    >
      <nav className="flex flex-col gap-3">
        {NAV_ITEMS.map(({ icon: Icon, key }) => (
          <button
            key={key}
            type="button"
            className={cn(
              'flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
              key === activeKey && 'bg-green-600 text-white hover:bg-green-600 hover:text-white'
            )}
          >
            <Icon className="size-[18px]" />
          </button>
        ))}
      </nav>
    </aside>
  );
}
