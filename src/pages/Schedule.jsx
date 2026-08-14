import { useMemo, useState } from 'react';
import { Moon, Bell, CalendarDays, Clock, Users } from 'lucide-react';

import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/role-context';
import { DOCTORS } from '@/context/role-context';

// Each doctor's appointments across a 7-day window (yesterday through the
// next 5 days), keyed by day offset from today (0 = today). A personal
// schedule needs to show more than "today/tomorrow" (that's what Today's
// Patient already covers) — this is the multi-day view a doctor needs to
// actually plan ahead. `status` is only meaningful for past/today entries;
// future days are still open slots so they carry no status.
const SCHEDULE_BY_DOCTOR = {
  'drg. SM': {
    '-1': [
      { time: '09:00', name: 'Yoga Pratama', keluhan: 'Tambal Gigi', durasi: '45 Min', status: 'Selesai' },
      { time: '11:00', name: 'Nadia Putri', keluhan: 'Konsultasi', durasi: '30 Min', status: 'Selesai' },
    ],
    0: [
      { time: '08:30', name: 'Agung Wijaya Kusuma', keluhan: 'Gigi Ngilu / Sensitive', durasi: '45 Min', status: 'Selesai' },
      { time: '09:00', name: 'Budi Santoso', keluhan: 'Scaling', durasi: '45 Min', status: 'Telat' },
      { time: '09:45', name: 'Rina Marlina', keluhan: 'Gigi Sensitif', durasi: '30 Min', status: 'Menunggu' },
      { time: '10:30', name: 'Dimas Saputra', keluhan: 'Gigi Berlubang', durasi: '60 Min', status: 'Menunggu' },
      { time: '11:15', name: 'Putri Amelia', keluhan: 'Whitening', durasi: '90 Min', status: 'Menunggu' },
    ],
    1: [
      { time: '09:00', name: 'Reza Kurniawan', keluhan: 'Sakit Gigi', durasi: '60 Min' },
      { time: '10:00', name: 'Hendra Gunawan', keluhan: 'Kontrol Kawat Gigi', durasi: '30 Min' },
    ],
    2: [{ time: '09:30', name: 'Citra Dewanti', keluhan: 'Whitening Sesi 2', durasi: '90 Min' }],
    3: [],
    4: [{ time: '10:00', name: 'Galih Prasetyo', keluhan: 'Tambal Gigi', durasi: '45 Min' }],
    5: [
      { time: '09:00', name: 'Jasmine Anggraini', keluhan: 'Karang Gigi', durasi: '45 Min' },
      { time: '13:30', name: 'Melati Suryani', keluhan: 'Kontrol Rutin', durasi: '30 Min' },
    ],
  },
  'drg. AN': {
    '-1': [{ time: '10:00', name: 'Vina Oktaviani', keluhan: 'Karang Gigi', durasi: '45 Min', status: 'Selesai' }],
    0: [
      { time: '08:45', name: 'Siti Rahmawati', keluhan: 'Gigi Berlubang', durasi: '60 Min', status: 'Menunggu' },
      { time: '09:30', name: 'Andi Pratama', keluhan: 'Tambal Gigi', durasi: '45 Min', status: 'Menunggu' },
      { time: '10:15', name: 'Nur Aisyah', keluhan: 'Karang Gigi', durasi: '45 Min', status: 'Menunggu' },
      { time: '11:00', name: 'Rizky Ramadhan', keluhan: 'Sakit Gusi', durasi: '45 Min', status: 'Batal' },
      { time: '11:45', name: 'Lina Wulandari', keluhan: 'Scaling', durasi: '45 Min', status: 'Menunggu' },
    ],
    1: [
      { time: '08:30', name: 'Melati Suryani', keluhan: 'Cabut Gigi Bungsu', durasi: '90 Min' },
      { time: '10:00', name: 'Doni Firmansyah', keluhan: 'Scaling', durasi: '45 Min' },
    ],
    2: [{ time: '11:30', name: 'Herlina Wati', keluhan: 'Konsultasi Behel', durasi: '30 Min' }],
    3: [{ time: '14:00', name: 'Krisna Ardiansyah', keluhan: 'Cabut Gigi', durasi: '60 Min' }],
    4: [],
    5: [{ time: '09:00', name: 'Andi Pratama', keluhan: 'Kontrol Tambal Gigi', durasi: '30 Min' }],
  },
  'drg. RF': {
    '-1': [{ time: '13:00', name: 'Indra Gunawan', keluhan: 'Gigi Ngilu', durasi: '45 Min', status: 'Selesai' }],
    0: [
      { time: '09:15', name: 'Dewi Lestari', keluhan: 'Sakit Gigi', durasi: '60 Min', status: 'Batal' },
      { time: '10:00', name: 'Fajar Hidayat', keluhan: 'Cabut Gigi', durasi: '60 Min', status: 'Menunggu' },
      { time: '10:45', name: 'Maya Sari', keluhan: 'Konsultasi', durasi: '30 Min', status: 'Telat' },
      { time: '11:30', name: 'Arif Setiawan', keluhan: 'Gigi Patah', durasi: '60 Min', status: 'Menunggu' },
    ],
    1: [{ time: '09:00', name: 'Bayu Kusnandar', keluhan: 'Gigi Berlubang', durasi: '45 Min' }],
    2: [
      { time: '10:30', name: 'Eka Purnama', keluhan: 'Sakit Gusi', durasi: '30 Min' },
      { time: '13:00', name: 'Lestari Handayani', keluhan: 'Sakit Gigi', durasi: '60 Min' },
    ],
    3: [],
    4: [{ time: '09:30', name: 'Ilham Maulana', keluhan: 'Cabut Gigi', durasi: '60 Min' }],
    5: [{ time: '11:00', name: 'Intan Permata', keluhan: 'Gigi Ngilu', durasi: '30 Min' }],
  },
};

const STATUS_STYLES = {
  Selesai: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Telat: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Batal: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  Menunggu: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
];

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function Schedule() {
  const { role, doctorName } = useRole();
  const isDoctor = role === 'Doctor';
  const [activeDoctor, setActiveDoctor] = useState(isDoctor ? doctorName : DOCTORS[0]);
  const [offset, setOffset] = useState(0);

  const effectiveDoctor = isDoctor ? doctorName : activeDoctor;

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const dayOffset = i - 1; // -1 (yesterday) through +5
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      return {
        offset: dayOffset,
        dayName: DAY_NAMES[d.getDay()],
        dateLabel: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
        isToday: dayOffset === 0,
      };
    });
  }, []);

  const appointments = SCHEDULE_BY_DOCTOR[effectiveDoctor]?.[offset] ?? [];
  const selectedDay = days.find((d) => d.offset === offset);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="schedule" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Jadwal Praktik</h1>
            <span className="text-sm text-slate-500">
              {isDoctor ? `Jadwal Anda – ${doctorName}` : 'Jadwal per Dokter'}
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

        <main className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
            {!isDoctor && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Pilih Dokter</span>
                <Select value={activeDoctor} onValueChange={setActiveDoctor}>
                  <SelectTrigger className="h-10 w-[180px] rounded-xl border-[#e2e8f0] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCTORS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 7-day strip */}
            <div className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              {days.map((d) => (
                <button
                  key={d.offset}
                  type="button"
                  onClick={() => setOffset(d.offset)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm transition-colors',
                    offset === d.offset
                      ? 'bg-green-600 text-white'
                      : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('text-xs font-medium', offset === d.offset ? 'text-white/80' : 'text-slate-400')}>
                    {d.dayName}
                    {d.isToday && ' · Hari Ini'}
                  </span>
                  <span className="font-semibold">{d.dateLabel}</span>
                </button>
              ))}
            </div>

            {/* Selected day list */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarDays className="size-4 text-slate-400" />
                  {selectedDay?.dayName}, {selectedDay?.dateLabel}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="size-3.5" />
                  {appointments.length} janji temu
                </span>
              </div>

              {appointments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Tidak ada janji temu pada hari ini.
                </p>
              ) : (
                <div className="flex flex-col">
                  {appointments.map((appt, i) => (
                    <div
                      key={`${appt.name}-${i}`}
                      className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-b-0"
                    >
                      <div className="flex w-14 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Clock className="size-3.5" />
                        {appt.time}
                      </div>
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {getInitials(appt.name)}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-slate-700">{appt.name}</span>
                        <span className="truncate text-xs text-slate-400">{appt.keluhan}</span>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{appt.durasi}</span>
                      {appt.status && (
                        <Badge className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px]', STATUS_STYLES[appt.status])}>
                          {appt.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
