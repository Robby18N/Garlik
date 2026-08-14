import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Moon,
  Bell,
  Users,
  CheckCircle2,
  Clock,
  Hourglass,
  DoorOpen,
  UserCheck,
  Brush,
  CalendarSearch,
  FileUser,
  Activity as ActivityIcon,
  CalendarDays,
  Pill,
  ArrowRight,
} from 'lucide-react';

import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import StatPill from '@/components/stat-pill';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/role-context';

// Same room -> doctor assignment used across Activity/Today's Patient
// (R1 = drg. SM, R2 = drg. AN, R3 = drg. RF), reused here purely to give
// the Dashboard's "Ruang Praktik Anda" tile a status without depending on
// Activity's own local state (each page keeps independent mock state, same
// convention already used throughout the app).
const ROOM_BY_DOCTOR = {
  'drg. SM': { id: 'R1', status: 'Occupied' },
  'drg. AN': { id: 'R2', status: 'Available' },
  'drg. RF': { id: 'R3', status: 'Cleaning' },
};

const ROOM_STATUS_STYLES = {
  Available: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Occupied: 'border-transparent bg-[rgba(59,130,246,0.08)] text-[#3b82f6]',
  Cleaning: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

const ROOM_STATUS_ICON = { Available: DoorOpen, Occupied: UserCheck, Cleaning: Brush };

const ROOM_STATUS_NOTE = {
  Available: 'Siap menerima pasien berikutnya.',
  Occupied: 'Sedang menangani pasien.',
  Cleaning: 'Sedang dibersihkan sebelum pasien berikutnya.',
};

// Today's schedule per doctor — mirrors the doctor/keluhan pairing already
// established in Today's Patient & Activity's mock data, trimmed to what a
// daily dashboard actually needs (time, name, keluhan, status).
const SCHEDULE_BY_DOCTOR = {
  'drg. SM': [
    { time: '08:30', name: 'Agung Wijaya Kusuma', keluhan: 'Gigi Ngilu / Sensitive', status: 'Complete' },
    { time: '09:00', name: 'Budi Santoso', keluhan: 'Scaling', status: 'Late' },
    { time: '09:45', name: 'Rina Marlina', keluhan: 'Gigi Sensitif', status: 'Waiting 20 Min' },
    { time: '10:30', name: 'Dimas Saputra', keluhan: 'Gigi Berlubang', status: 'Waiting 20 Min' },
    { time: '11:15', name: 'Putri Amelia', keluhan: 'Whitening', status: 'Waiting 20 Min' },
  ],
  'drg. AN': [
    { time: '08:45', name: 'Siti Rahmawati', keluhan: 'Gigi Berlubang', status: 'Waiting 10 Min' },
    { time: '09:30', name: 'Andi Pratama', keluhan: 'Tambal Gigi', status: 'Waiting 10 Min' },
    { time: '10:15', name: 'Nur Aisyah', keluhan: 'Karang Gigi', status: 'Waiting 20 Min' },
    { time: '11:00', name: 'Rizky Ramadhan', keluhan: 'Sakit Gusi', status: 'Cancel' },
    { time: '11:45', name: 'Lina Wulandari', keluhan: 'Scaling', status: 'Waiting 10 Min' },
  ],
  'drg. RF': [
    { time: '09:15', name: 'Dewi Lestari', keluhan: 'Sakit Gigi', status: 'Cancel' },
    { time: '10:00', name: 'Fajar Hidayat', keluhan: 'Cabut Gigi', status: 'Waiting 10 Min' },
    { time: '10:45', name: 'Maya Sari', keluhan: 'Konsultasi', status: 'Late' },
    { time: '11:30', name: 'Arif Setiawan', keluhan: 'Gigi Patah', status: 'Waiting 10 Min' },
  ],
};

const STATUS_STYLES = {
  Complete: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Late: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Cancel: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  'Waiting 10 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  'Waiting 20 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

const QUICK_LINKS = [
  { icon: CalendarSearch, label: "Today's Patient", path: '/patients' },
  { icon: ActivityIcon, label: 'Activity', path: '/activity' },
  { icon: FileUser, label: 'Records', path: '/records' },
  { icon: CalendarDays, label: 'Jadwal Praktik', path: '/schedule' },
  { icon: Pill, label: 'E-Resep', path: '/resep' },
];

export default function Dashboard() {
  const { role, doctorName } = useRole();
  const isDoctor = role === 'Doctor';

  const schedule = isDoctor ? SCHEDULE_BY_DOCTOR[doctorName] ?? [] : [];
  const room = isDoctor ? ROOM_BY_DOCTOR[doctorName] : null;

  const stats = useMemo(() => {
    const total = schedule.length;
    const complete = schedule.filter((p) => p.status === 'Complete').length;
    const waiting = schedule.filter((p) => p.status?.startsWith('Waiting')).length;
    const upcoming = schedule.filter((p) => p.status?.startsWith('Waiting'));
    return { total, complete, waiting, upcoming };
  }, [schedule]);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="grid" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            <span className="text-sm text-slate-500">
              {isDoctor ? `Ringkasan Praktik Anda – ${doctorName}` : 'Ringkasan Klinik Hari Ini'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Toggle theme"
            >
              <Moon className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <AccountMenu />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          {!isDoctor ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                Dashboard ringkasan ini sedang dirancang khusus untuk alur kerja Dokter.
              </p>
              <p className="text-sm text-slate-400">
                Gunakan menu Today&apos;s Patient atau Activity untuk ringkasan klinik hari ini.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
              {/* Top metrics */}
              <div className="flex flex-wrap gap-4">
                <StatPill icon={<Users className="size-4" />} label="Pasien Hari Ini" value={stats.total} />
                <StatPill icon={<CheckCircle2 className="size-4" />} label="Sudah Selesai" value={stats.complete} />
                <StatPill icon={<Hourglass className="size-4" />} label="Menunggu Giliran" value={stats.waiting} />
                <StatPill
                  icon={<Clock className="size-4" />}
                  label="Janji Berikutnya"
                  value={stats.upcoming[0]?.time ?? '-'}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
                {/* Room status */}
                <div className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Ruang Praktik Anda</p>
                    {room && (
                      <Badge className={cn('gap-1.5 rounded-full px-3 py-1 text-xs', ROOM_STATUS_STYLES[room.status])}>
                        {(() => {
                          const Icon = ROOM_STATUS_ICON[room.status];
                          return <Icon className="size-3.5" />;
                        })()}
                        {room.status}
                      </Badge>
                    )}
                  </div>
                  {room ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-slate-50 text-2xl font-semibold text-slate-700">
                        {room.id}
                      </div>
                      <p className="max-w-xs text-sm text-slate-500">{ROOM_STATUS_NOTE[room.status]}</p>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400">Tidak ada ruangan yang ditugaskan.</p>
                  )}
                  <Link
                    to="/activity"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Buka Activity
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                {/* Upcoming schedule */}
                <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Jadwal Hari Ini</p>
                    <Link to="/patients" className="text-xs font-medium text-[#3b82f6] hover:underline">
                      Lihat Semua
                    </Link>
                  </div>
                  {schedule.length === 0 ? (
                    <p className="py-4 text-sm text-slate-400">Tidak ada jadwal hari ini.</p>
                  ) : (
                    schedule.map((p, i) => (
                      <div
                        key={`${p.name}-${i}`}
                        className="flex items-center gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">
                          {getInitials(p.name)}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-slate-700">{p.name}</span>
                          <span className="truncate text-xs text-slate-400">{p.keluhan}</span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{p.time}</span>
                        <Badge className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px]', STATUS_STYLES[p.status])}>
                          {p.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                <p className="text-sm font-semibold text-slate-900">Aksi Cepat</p>
                <div className="flex flex-wrap gap-3">
                  {QUICK_LINKS.map(({ icon: Icon, label, path }) => (
                    <Link
                      key={path}
                      to={path}
                      className="flex flex-1 min-w-[140px] items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Icon className="size-4 text-slate-500" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
