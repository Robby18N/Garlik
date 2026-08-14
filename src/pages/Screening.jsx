import { useMemo, useState } from 'react';
import {
  Moon,
  Bell,
  ClipboardList,
  ClipboardCheck,
  ShieldAlert,
  Timer,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import { StatCard, DetailHighlightToggle } from '@/components/stat-card';
import { TextField, FieldRow, SectionHeader } from '@/components/form-fields';
import { useRole } from '@/context/role-context';
import { cn } from '@/lib/utils';

// Quick reception-side triage checklist — a short list purely for the
// front-desk screening step, distinct from the full doctor-level medical
// history captured later in New Registration's "Medical Record" step.
const CONDITION_FIELDS = [
  ['alergiObat', 'Alergi Obat'],
  ['riwayatJantung', 'Riwayat Penyakit Jantung'],
  ['hipertensi', 'Hipertensi'],
  ['diabetes', 'Diabetes'],
  ['kehamilan', 'Sedang Hamil'],
  ['pendarahan', 'Riwayat Pendarahan Berlebih'],
];

// New (not-yet-seen) patients waiting on the receptionist's screening step
// before they can be routed to a room/doctor — this is the queue the new
// "Skrining" menu exists to manage. A handful are already screened today
// so the summary row and history view have something to show.
const SCREENING_QUEUE_INITIAL = [
  {
    id: 1, mrn: 'P-0201', name: 'Rian Maulana', phone: '0813-9021-4471',
    registeredAt: '08:05', appt: '09:00', keluhan: 'Gigi berlubang, nyeri saat mengunyah',
    status: 'Menunggu',
  },
  {
    id: 2, mrn: 'P-0202', name: 'Ayu Kartika', phone: '0821-9058-4562',
    registeredAt: '08:20', appt: '09:30', keluhan: 'Gusi bengkak sejak 3 hari',
    status: 'Menunggu',
  },
  {
    id: 3, mrn: 'P-0203', name: 'Bagas Setiawan', phone: '0822-9095-4653',
    registeredAt: '07:40', appt: '08:15', keluhan: 'Kontrol kawat gigi',
    status: 'Selesai', screenedAt: '07:52', screenedBy: 'Receptionist', durationMin: 6,
    vitals: { suhu: '36.8', tensi: '120/80', berat: '58', tinggi: '162' },
    conditions: { alergiObat: 'Yes' },
    notes: 'Alergi amoxicillin — sudah dicatat di rekam medis.',
  },
  {
    id: 4, mrn: 'P-0204', name: 'Sri Wahyuni', phone: '0851-9132-4744',
    registeredAt: '07:50', appt: '08:30', keluhan: 'Scaling rutin',
    status: 'Selesai', screenedAt: '08:01', screenedBy: 'Receptionist', durationMin: 5,
    vitals: { suhu: '36.5', tensi: '110/75', berat: '52', tinggi: '158' },
    conditions: {},
    notes: '',
  },
  {
    id: 5, mrn: 'P-0205', name: 'Dedi Kurniawan', phone: '0852-9169-4835',
    registeredAt: '08:35', appt: '10:00', keluhan: 'Sakit gigi geraham belakang',
    status: 'Menunggu',
  },
  {
    id: 6, mrn: 'P-0206', name: 'Farah Amelia', phone: '0895-9206-4926',
    registeredAt: '07:58', appt: '08:45', keluhan: 'Konsultasi gigi sensitif',
    status: 'Selesai', screenedAt: '08:07', screenedBy: 'Receptionist', durationMin: 9,
    vitals: { suhu: '37.1', tensi: '138/88', berat: '65', tinggi: '167' },
    conditions: { riwayatJantung: 'Yes', hipertensi: 'Yes' },
    notes: 'Tensi sedikit tinggi, mohon dokter dikonfirmasi ulang sebelum tindakan.',
  },
  {
    id: 7, mrn: 'P-0207', name: 'Galang Prakoso', phone: '0896-9243-5017',
    registeredAt: '08:50', appt: '10:30', keluhan: 'Konsultasi pasang kawat gigi',
    status: 'Menunggu',
  },
  {
    id: 8, mrn: 'P-0208', name: 'Hesti Purnama', phone: '0812-9280-5108',
    registeredAt: '08:02', appt: '09:00', keluhan: 'Cabut gigi susu',
    status: 'Selesai', screenedAt: '08:11', screenedBy: 'Receptionist', durationMin: 4,
    vitals: { suhu: '36.6', tensi: '115/78', berat: '30', tinggi: '128' },
    conditions: {},
    notes: '',
  },
];

const STATUS_STYLES = {
  Menunggu: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  Selesai: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
};

// Explicit column widths so `table-fixed` doesn't split width evenly —
// without this the "No" column (just 1-2 digits) ended up as wide as
// "Keluhan Awal", leaving it looking oddly stretched.
const COL_WIDTH = {
  no: 'w-[5%]',
  mrn: 'w-[10%]',
  name: 'w-[16%]',
  phone: 'w-[12%]',
  keluhan: 'w-[25%]',
  appt: 'w-[10%]',
  status: 'w-[10%]',
  action: 'w-[12%]',
};

const HEADER_CLASS = 'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function YesNoField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-6">
        {['Yes', 'No'].map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
          >
            <input
              type="radio"
              className="size-4 accent-green-600"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function ScreeningSheet({ patient, open, onOpenChange, onComplete }) {
  const { role } = useRole();
  const [vitals, setVitals] = useState({ suhu: '', tensi: '', berat: '', tinggi: '' });
  const [conditions, setConditions] = useState({});
  const [notes, setNotes] = useState('');
  const [openedAt, setOpenedAt] = useState(null);

  function resetForm() {
    setVitals({ suhu: '', tensi: '', berat: '', tinggi: '' });
    setConditions({});
    setNotes('');
    setOpenedAt(null);
  }

  function handleOpenChange(next) {
    if (next && patient && patient.status === 'Menunggu' && !openedAt) {
      setOpenedAt(Date.now());
    }
    if (!next) resetForm();
    onOpenChange(next);
  }

  const flaggedConditions = Object.entries(conditions).filter(([, v]) => v === 'Yes');

  function handleSubmit() {
    if (!vitals.suhu || !vitals.tensi) {
      toast.error('Isi minimal Suhu Tubuh dan Tekanan Darah sebelum menyelesaikan skrining');
      return;
    }
    const durationMin = openedAt ? Math.max(1, Math.round((Date.now() - openedAt) / 60000)) : 1;
    onComplete(patient.id, {
      screenedAt: nowTimeLabel(),
      screenedBy: role,
      durationMin,
      vitals,
      conditions,
      notes,
    });
    toast.success(`Skrining ${patient.name} selesai dicatat`);
    handleOpenChange(false);
  }

  const isDone = patient?.status === 'Selesai';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {!patient ? (
          <SheetHeader className="border-b">
            <SheetTitle>Detail Skrining</SheetTitle>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="border-b px-6 py-6">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="text-lg">{patient.name}</SheetTitle>
                <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[patient.status])}>
                  {patient.status}
                </Badge>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {patient.mrn} &middot; {patient.phone}
              </p>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-[17px]">
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Keluhan Awal
                </p>
                <p className="text-sm text-slate-700">{patient.keluhan}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Terdaftar {patient.registeredAt} &middot; Jadwal Appt {patient.appt}
                </p>
              </div>

              {isDone ? (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionHeader first>Tanda Vital</SectionHeader>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <span className="text-slate-500">Suhu Tubuh</span>
                        <span className="font-medium text-slate-800">{patient.vitals?.suhu} °C</span>
                      </div>
                      <div className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <span className="text-slate-500">Tekanan Darah</span>
                        <span className="font-medium text-slate-800">{patient.vitals?.tensi} mmHg</span>
                      </div>
                      <div className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <span className="text-slate-500">Berat Badan</span>
                        <span className="font-medium text-slate-800">{patient.vitals?.berat} kg</span>
                      </div>
                      <div className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <span className="text-slate-500">Tinggi Badan</span>
                        <span className="font-medium text-slate-800">{patient.vitals?.tinggi} cm</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#e2e8f0] pt-5">
                    <SectionHeader first>Kondisi Khusus</SectionHeader>
                    {Object.entries(patient.conditions ?? {}).filter(([, v]) => v === 'Yes').length === 0 ? (
                      <p className="text-sm text-slate-400">Tidak ada kondisi khusus yang ditemukan.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(patient.conditions ?? {})
                          .filter(([, v]) => v === 'Yes')
                          .map(([key]) => {
                            const label = CONDITION_FIELDS.find(([k]) => k === key)?.[1] ?? key;
                            return (
                              <Badge
                                key={key}
                                className="rounded-full border-transparent bg-[rgba(239,68,68,0.08)] px-2.5 py-1 text-[#ef4444]"
                              >
                                {label}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {patient.notes && (
                    <div className="flex flex-col gap-1.5 border-t border-[#e2e8f0] pt-5">
                      <SectionHeader first>Catatan Tambahan</SectionHeader>
                      <p className="text-sm text-slate-600">{patient.notes}</p>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[rgba(34,197,94,0.06)] p-4">
                    <ClipboardCheck className="size-5 shrink-0 text-[#16a34a]" />
                    <div className="flex flex-col">
                      <p className="text-[13px] font-medium text-foreground">
                        Diskrining oleh {patient.screenedBy}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {patient.screenedAt} &middot; {patient.durationMin} menit
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionHeader first>Tanda Vital</SectionHeader>
                    <FieldRow className="flex-wrap">
                      <TextField
                        label="Suhu Tubuh (°C)"
                        required
                        placeholder="36.5"
                        value={vitals.suhu}
                        onChange={(e) => setVitals((prev) => ({ ...prev, suhu: e.target.value }))}
                        style={{ flexGrow: 140, flexBasis: '140px' }}
                      />
                      <TextField
                        label="Tekanan Darah"
                        required
                        placeholder="120/80"
                        value={vitals.tensi}
                        onChange={(e) => setVitals((prev) => ({ ...prev, tensi: e.target.value }))}
                        style={{ flexGrow: 140, flexBasis: '140px' }}
                      />
                      <TextField
                        label="Berat Badan (kg)"
                        placeholder="55"
                        value={vitals.berat}
                        onChange={(e) => setVitals((prev) => ({ ...prev, berat: e.target.value }))}
                        style={{ flexGrow: 140, flexBasis: '140px' }}
                      />
                      <TextField
                        label="Tinggi Badan (cm)"
                        placeholder="160"
                        value={vitals.tinggi}
                        onChange={(e) => setVitals((prev) => ({ ...prev, tinggi: e.target.value }))}
                        style={{ flexGrow: 140, flexBasis: '140px' }}
                      />
                    </FieldRow>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-[#e2e8f0] pt-5">
                    <SectionHeader first>Kondisi Khusus</SectionHeader>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      {CONDITION_FIELDS.map(([field, label]) => (
                        <YesNoField
                          key={field}
                          label={label}
                          value={conditions[field]}
                          onChange={(value) => setConditions((prev) => ({ ...prev, [field]: value }))}
                        />
                      ))}
                    </div>
                  </div>

                  {flaggedConditions.length > 0 && (
                    <Alert variant="destructive">
                      <ShieldAlert />
                      <AlertTitle>Kondisi khusus ditemukan</AlertTitle>
                      <AlertDescription>
                        Pastikan informasi ini disampaikan ke dokter sebelum tindakan dimulai.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-1.5 border-t border-[#e2e8f0] pt-5">
                    <SectionHeader first>Catatan Tambahan</SectionHeader>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Catatan tambahan dari hasil skrining (opsional)..."
                      className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                  </div>
                </>
              )}
            </div>

            <SheetFooter className="flex-row border-t">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-9 flex-1 rounded-full text-sm font-medium"
              >
                {isDone ? 'Tutup' : 'Batal'}
              </Button>
              {!isDone && (
                <Button
                  onClick={handleSubmit}
                  className="h-9 flex-1 rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                >
                  <ClipboardCheck className="size-4" />
                  Selesai Skrining
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Screening() {
  const [queue, setQueue] = useState(SCREENING_QUEUE_INITIAL);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleOpenPatient(patient) {
    setSelected(patient);
    setSheetOpen(true);
  }

  function handleComplete(id, result) {
    setQueue((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Selesai', ...result } : p))
    );
  }

  const stats = useMemo(() => {
    const waiting = queue.filter((p) => p.status === 'Menunggu');
    const done = queue.filter((p) => p.status === 'Selesai');
    const flagged = done.filter((p) => Object.values(p.conditions ?? {}).some((v) => v === 'Yes'));
    const avgDuration = done.length
      ? Math.round(done.reduce((sum, p) => sum + (p.durationMin ?? 0), 0) / done.length)
      : 0;
    return { waiting, done, flagged, avgDuration };
  }, [queue]);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="screening" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Skrining</h1>
            <span className="text-sm text-slate-500">Skrining Awal Pasien Baru</span>
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
          <div className="flex w-full flex-col gap-3">
            <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

            <div className="flex w-full items-start gap-4">
              <StatCard
                icon={<ClipboardList className="size-4" />}
                title="Perlu Skrining"
                count={stats.waiting.length}
                showDetail={showDetail}
              >
                {stats.waiting.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada pasien menunggu skrining.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.waiting.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <span className="shrink-0 text-slate-400">{p.appt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<ClipboardCheck className="size-4" />}
                title="Selesai Hari Ini"
                count={stats.done.length}
                showDetail={showDetail}
              >
                {stats.done.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Belum ada skrining selesai hari ini.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.done.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <span className="shrink-0 text-slate-400">{p.screenedAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<ShieldAlert className="size-4" />}
                title="Kondisi Khusus Ditemukan"
                count={stats.flagged.length}
                showDetail={showDetail}
              >
                {stats.flagged.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada kondisi khusus ditemukan hari ini.</p>
                ) : (
                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {stats.flagged.map((p) => (
                      <div key={p.id} className="flex flex-col gap-1 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(p.conditions ?? {})
                            .filter(([, v]) => v === 'Yes')
                            .map(([key]) => (
                              <span
                                key={key}
                                className="rounded-full bg-[rgba(239,68,68,0.08)] px-2 py-0.5 text-[11px] font-medium text-[#ef4444]"
                              >
                                {CONDITION_FIELDS.find(([k]) => k === key)?.[1] ?? key}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<Timer className="size-4" />}
                title="Rata-rata Durasi Skrining"
                count={`${stats.avgDuration} min`}
                showDetail={showDetail}
              >
                {stats.done.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Belum ada data durasi hari ini.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.done.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {p.durationMin} menit
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-slate-500" />
              <p className="text-base font-semibold text-slate-950">Antrian Skrining Pasien Baru</p>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.no)}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.mrn)}>MRN</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.name)}>Nama Pasien</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.phone)}>Telp</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.keluhan)}>Keluhan Awal</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.appt)}>Jadwal Appt</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.status)}>Status</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.action)}>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((patient, index) => (
                    <TableRow
                      key={patient.id}
                      className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}
                    >
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.mrn}</TableCell>
                      <TableCell className="!align-middle py-3 text-left font-medium text-slate-700">{patient.name}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.phone}</TableCell>
                      <TableCell className="!align-middle py-3 whitespace-normal text-left text-[#334155]">{patient.keluhan}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.appt}</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[patient.status])}>
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <Button
                          size="sm"
                          variant={patient.status === 'Selesai' ? 'outline' : 'default'}
                          onClick={() => handleOpenPatient(patient)}
                          className={cn(
                            'h-8 rounded-full px-3 text-xs font-medium',
                            patient.status !== 'Selesai' && 'bg-green-600 text-white hover:bg-green-700'
                          )}
                        >
                          {patient.status === 'Selesai' ? 'Lihat Hasil' : 'Mulai Skrining'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ScreeningSheet
            patient={selected}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onComplete={handleComplete}
          />
        </main>
      </div>
    </div>
  );
}
