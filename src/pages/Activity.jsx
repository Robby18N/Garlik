import { useEffect, useMemo, useState } from 'react';
import {
  Moon,
  Bell,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  DoorOpen,
  UserCheck,
  Brush,
  Clock,
  Users,
  Timer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import { StatCard, DetailHighlightToggle } from '@/components/stat-card';
import { cn } from '@/lib/utils';

const ROOM_STATUS_DOT = { Available: 'bg-green-500', Occupied: 'bg-blue-500', Cleaning: 'bg-orange-500' };

// Per-room live queue board — each room cycles Available -> Occupied ->
// Cleaning -> Available as staff work through it, matching the Activity
// menu's scope from our UAM breakdown (real-time queue board per room,
// Call Next Patient action, per-room status, today's activity log).
// `startedAt` is a fixed timestamp computed once at module load (not on
// every render) purely to seed a believable "already in progress" demo
// state; the elapsed-time display below ticks forward from it live.
const NOW_AT_LOAD = Date.now();

const ROOMS_INITIAL = [
  {
    id: 'R1',
    doctor: 'drg. SM',
    status: 'Occupied',
    current: {
      name: 'Agung Wijaya Kusuma',
      keluhan: 'Gigi Ngilu / Sensitive',
      estDuration: 45,
      startedAt: NOW_AT_LOAD - 12 * 60000,
    },
    queue: [
      { name: 'Budi Santoso', appt: '09:00', keluhan: 'Scaling', waitMin: 18 },
      { name: 'Dimas Saputra', appt: '10:30', keluhan: 'Gigi Berlubang', waitMin: 42 },
    ],
  },
  {
    id: 'R2',
    doctor: 'drg. AN',
    status: 'Available',
    current: null,
    queue: [
      { name: 'Siti Rahmawati', appt: '08:45', keluhan: 'Gigi Berlubang', waitMin: 6 },
      { name: 'Andi Pratama', appt: '09:30', keluhan: 'Tambal Gigi', waitMin: 24 },
      { name: 'Nur Aisyah', appt: '10:15', keluhan: 'Karang Gigi', waitMin: 38 },
    ],
  },
  {
    id: 'R3',
    doctor: 'drg. RF',
    status: 'Cleaning',
    current: null,
    queue: [
      { name: 'Fajar Hidayat', appt: '10:00', keluhan: 'Cabut Gigi', waitMin: 15 },
    ],
  },
];

const LOG_INITIAL = [
  { time: '11:15', action: 'called', room: 'R1', patient: 'Agung Wijaya Kusuma', doctor: 'drg. SM' },
  { time: '10:52', action: 'ready', room: 'R2', doctor: 'drg. AN' },
  { time: '10:50', action: 'finished', room: 'R3', patient: 'Rina Marlina', doctor: 'drg. RF' },
  { time: '10:20', action: 'called', room: 'R3', patient: 'Rina Marlina', doctor: 'drg. RF' },
  { time: '10:05', action: 'finished', room: 'R2', patient: 'Wahyu Nugroho', doctor: 'drg. AN' },
];

const ROOM_STATUS_STYLES = {
  Available: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Occupied: 'border-transparent bg-[rgba(59,130,246,0.08)] text-[#3b82f6]',
  Cleaning: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

const ROOM_STATUS_ICON = {
  Available: DoorOpen,
  Occupied: UserCheck,
  Cleaning: Brush,
};

const ACTIVITY_META = {
  called: { icon: PhoneCall, color: 'text-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.08)]' },
  finished: { icon: CheckCircle2, color: 'text-[#16a34a]', bg: 'bg-[rgba(34,197,94,0.08)]' },
  ready: { icon: Sparkles, color: 'text-[#f97316]', bg: 'bg-[rgba(249,115,22,0.08)]' },
};

function activityDescription(entry) {
  if (entry.action === 'called') return `Memanggil ${entry.patient} ke ${entry.room}`;
  if (entry.action === 'finished') return `Selesai melayani ${entry.patient} di ${entry.room}`;
  return `${entry.room} siap digunakan`;
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// Formatted by hand (rather than toLocaleTimeString) so live log entries
// always use "HH:MM" — the id-ID locale renders a dot separator ("12.46")
// which would otherwise clash with the seeded demo entries below that use
// a colon ("11:15").
function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function RoomCard({ room, elapsedMin, onCallNext, onFinish, onReady }) {
  const StatusIcon = ROOM_STATUS_ICON[room.status];
  const upcoming = room.queue.slice(0, room.status === 'Available' ? 2 : 3);
  const overflow = room.queue.length - upcoming.length;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-base font-semibold text-slate-900">{room.id}</p>
          <p className="text-xs text-slate-500">{room.doctor}</p>
        </div>
        <Badge className={cn('gap-1 rounded-full px-2.5 py-1', ROOM_STATUS_STYLES[room.status])}>
          <StatusIcon className="size-3.5" />
          {room.status}
        </Badge>
      </div>

      {room.status === 'Occupied' && room.current && (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50/60 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {getInitials(room.current.name)}
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium text-slate-800">{room.current.name}</p>
              <p className="truncate text-xs text-slate-500">{room.current.keluhan}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {elapsedMin} menit berjalan
              </span>
              <span>Est. {room.current.estDuration} Min</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
                style={{ width: `${Math.min(100, (elapsedMin / room.current.estDuration) * 100)}%` }}
              />
            </div>
          </div>
          <Button
            onClick={() => onFinish(room.id)}
            className="h-9 w-full rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
          >
            <CheckCircle2 className="size-4" />
            Selesai Layani
          </Button>
        </div>
      )}

      {room.status === 'Available' && (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50/60 p-3">
          <p className="text-xs font-medium text-slate-500">
            {room.queue.length > 0 ? 'Ruangan siap — antrian menunggu' : 'Ruangan siap, belum ada antrian'}
          </p>
          <Button
            onClick={() => onCallNext(room.id)}
            disabled={room.queue.length === 0}
            className="h-9 w-full rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
          >
            <PhoneCall className="size-4" />
            Call Next Patient
          </Button>
        </div>
      )}

      {room.status === 'Cleaning' && (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Brush className="size-3.5" />
            Sedang dibersihkan
          </p>
          <Button
            onClick={() => onReady(room.id)}
            className="h-9 w-full rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
          >
            <Sparkles className="size-4" />
            Tandai Ruangan Siap
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Antrian Berikutnya {room.queue.length > 0 && `(${room.queue.length})`}
        </p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400">Tidak ada antrian.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {upcoming.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5 text-xs"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-slate-700">{p.name}</span>
                  <span className="truncate text-slate-400">{p.keluhan}</span>
                </div>
                <span className="shrink-0 text-slate-400">{p.appt}</span>
              </div>
            ))}
            {overflow > 0 && (
              <p className="text-center text-[11px] text-slate-400">+{overflow} pasien lagi</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Activity() {
  const [rooms, setRooms] = useState(ROOMS_INITIAL);
  const [log, setLog] = useState(LOG_INITIAL);
  const [showDetail, setShowDetail] = useState(false);
  // Ticks every 30s purely to re-render elapsed-time displays for whichever
  // room is Occupied — no server round-trip, just a local clock refresh.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  function pushLog(entry) {
    setLog((prev) => [{ time: nowTimeLabel(), ...entry }, ...prev]);
  }

  function handleCallNext(roomId) {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId || room.status !== 'Available' || room.queue.length === 0) return room;
        const [next, ...rest] = room.queue;
        pushLog({ action: 'called', room: room.id, patient: next.name, doctor: room.doctor });
        return {
          ...room,
          status: 'Occupied',
          current: { name: next.name, keluhan: next.keluhan, estDuration: 45, startedAt: Date.now() },
          queue: rest,
        };
      })
    );
  }

  function handleFinish(roomId) {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId || room.status !== 'Occupied') return room;
        pushLog({ action: 'finished', room: room.id, patient: room.current?.name, doctor: room.doctor });
        return { ...room, status: 'Cleaning', current: null };
      })
    );
  }

  function handleReady(roomId) {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId || room.status !== 'Cleaning') return room;
        pushLog({ action: 'ready', room: room.id, doctor: room.doctor });
        return { ...room, status: 'Available' };
      })
    );
  }

  const stats = useMemo(() => {
    const activeRooms = rooms.filter((r) => r.status === 'Occupied').length;
    const totalWaiting = rooms.reduce((sum, r) => sum + r.queue.length, 0);
    const finishedList = log.filter((entry) => entry.action === 'finished');
    const waitList = rooms
      .flatMap((r) => r.queue.map((p) => ({ room: r.id, name: p.name, waitMin: p.waitMin })))
      .sort((a, b) => b.waitMin - a.waitMin);
    const avgWait = waitList.length
      ? Math.round(waitList.reduce((sum, p) => sum + p.waitMin, 0) / waitList.length)
      : 0;
    return {
      activeRooms,
      totalWaiting,
      finishedToday: finishedList.length,
      finishedList,
      waitList,
      avgWait,
    };
  }, [rooms, log]);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="activity" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Activity</h1>
            <span className="text-sm text-slate-500">Papan Antrian &amp; Aktivitas Hari Ini</span>
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
          {/* Overview stat row — same expandable StatCard format used on
              Today's Patient, so every page's summary row reads identically. */}
          <div className="flex w-full flex-col gap-3">
            <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

            <div className="flex w-full items-start gap-4">
              <StatCard
                icon={<UserCheck className="size-4" />}
                title="Ruangan Aktif"
                count={`${stats.activeRooms}/${rooms.length}`}
                showDetail={showDetail}
              >
                <div className="flex flex-col gap-1.5 overflow-y-auto">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-slate-700">
                        {room.id} &middot; {room.doctor}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('size-1.5 rounded-full', ROOM_STATUS_DOT[room.status])} />
                        <span className="text-slate-500">{room.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<Users className="size-4" />}
                title="Pasien Menunggu"
                count={stats.totalWaiting}
                showDetail={showDetail}
              >
                {stats.waitList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada pasien menunggu.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.waitList.map((p, i) => (
                      <div key={`${p.room}-${i}`} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">
                          {p.name} <span className="text-slate-400">&middot; {p.room}</span>
                        </span>
                        <span className="shrink-0 text-slate-400">{p.waitMin} menit</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<CheckCircle2 className="size-4" />}
                title="Selesai Hari Ini"
                count={stats.finishedToday}
                showDetail={showDetail}
              >
                {stats.finishedList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Belum ada yang selesai hari ini.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.finishedList.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">
                          {entry.patient} <span className="text-slate-400">&middot; {entry.room}</span>
                        </span>
                        <span className="shrink-0 text-slate-400">{entry.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<Timer className="size-4" />}
                title="Rata-rata Waktu Tunggu"
                count={`${stats.avgWait} min`}
                showDetail={showDetail}
              >
                {stats.waitList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada antrian untuk dihitung.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.waitList.map((p, i) => (
                      <div key={`${p.room}-avg-${i}`} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.room}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {p.waitMin} menit
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>
            </div>
          </div>

          {/* Per-room queue board */}
          <div className="flex w-full items-stretch gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                elapsedMin={
                  room.current ? Math.max(0, Math.floor((now - room.current.startedAt) / 60000)) : 0
                }
                onCallNext={handleCallNext}
                onFinish={handleFinish}
                onReady={handleReady}
              />
            ))}
          </div>

          {/* Today's activity log */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-base font-semibold text-slate-950">Log Aktivitas Hari Ini</p>
            <div className="flex flex-col">
              {log.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Belum ada aktivitas hari ini.</p>
              ) : (
                log.map((entry, i) => {
                  const meta = ACTIVITY_META[entry.action];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 border-b border-[#e2e8f0] px-1 py-2.5 last:border-b-0',
                        i % 2 === 1 && 'bg-[#f8fafc]'
                      )}
                    >
                      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', meta.bg, meta.color)}>
                        <Icon className="size-4" />
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{activityDescription(entry)}</p>
                      <span className="shrink-0 text-xs text-slate-400">{entry.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
