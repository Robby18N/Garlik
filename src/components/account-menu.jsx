import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ACCOUNTS, useRole } from '@/context/role-context';

// Avatar initials per account — a doctor account shows their own initials
// (e.g. "drg. SM" -> "SM") instead of a fixed placeholder, since which
// doctor is logged in actually matters (it scopes Today's Patient and the
// remark chat's sender identity).
function getAvatarInitials(account) {
  if (account.role === 'Doctor') return account.doctorName.replace('drg. ', '').toUpperCase();
  if (account.role === 'Admin') return 'AD';
  return 'RN';
}

/** Account switcher dropdown for the top header bar: avatar + current
 * account label + chevron trigger, a radio list of the five demo accounts
 * (Receptionist, each doctor, Admin), and a Logout action at the bottom.
 * This mirrors the same account list used on the Login screen, so
 * switching here is equivalent to logging out and back in as that account
 * — a fast way to preview each role's access without leaving the app.
 * The active account lives in shared context (see role-context.jsx) so
 * AppSidebar, Today's Patient, and everything else scoped to role/doctor
 * re-renders immediately when it changes. */
export default function AccountMenu() {
  const navigate = useNavigate();
  const { account, applyAccount, logout } = useRole();

  function handleSelectAccount(username) {
    const next = ACCOUNTS.find((a) => a.username === username);
    if (next) applyAccount(next);
  }

  function handleLogout() {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#16a34a] data-[state=open]:bg-slate-100"
        aria-label="Account menu"
      >
        <Avatar className="size-[30px]">
          <AvatarFallback className="bg-green-100 text-green-700">
            {getAvatarInitials(account)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-slate-700">{account.label}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={account.username} onValueChange={handleSelectAccount}>
          {ACCOUNTS.map((acc) => (
            <DropdownMenuRadioItem key={acc.username} value={acc.username}>
              {acc.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
