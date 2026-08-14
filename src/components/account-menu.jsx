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
import { ROLES, useRole } from '@/context/role-context';

/** Account / role-switcher dropdown for the top header bar: avatar + current
 * role label + chevron trigger, a radio list of the three available
 * roles, and a Logout action at the bottom. Role lives in shared context
 * (see role-context.jsx) so AppSidebar re-renders with the right
 * hidden/restricted nav items the moment the role changes here. */
export default function AccountMenu() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();

  function handleLogout() {
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
          <AvatarFallback className="bg-green-100 text-green-700">RN</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-slate-700">{role}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={role} onValueChange={setRole}>
          {ROLES.map((r) => (
            <DropdownMenuRadioItem key={r} value={r}>
              {r}
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
