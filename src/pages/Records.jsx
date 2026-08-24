import { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, Bell, Search, X, Eye, Users, Star, UserPlus, Repeat2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import PatientNameHoverCard from '@/components/patient-name-hover-card';
import PatientDetailSheet from '@/components/patient-detail-sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const CATEGORY_DOT = { VVIP: 'bg-amber-500', VIP: 'bg-green-500', Regular: 'bg-slate-400' };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Converts a Supabase `date` column (plain "2026-08-10" string, no time/TZ
// component) into the short human-readable label used everywhere in this
// page ("10 Aug 2026") — matching the format the rest of the app already
// renders (Today's Patient header, patient-detail-sheet's own todayLabel).
// The literal "T00:00:00" keeps the parse anchored to local midnight rather
// than UTC midnight, so it can't roll back a day in negative-UTC-offset
// timezones.
function formatDisplayDate(isoDate) {
  if (!isoDate) return null;
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getDate()} ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

const CATEGORY_FILTERS = ['Semua', 'VVIP', 'VIP', 'Regular'];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Terbaru Terdaftar' },
  { value: 'name', label: 'Nama (A-Z)' },
  { value: 'visits', label: 'Kunjungan Terbanyak' },
];

const CATEGORY_BADGE = {
  VVIP: 'border-transparent bg-[rgba(180,83,9,0.08)] text-[#b45309]',
  VIP: 'border-transparent bg-[rgba(33,140,33,0.08)] text-[#218c21]',
  Regular: 'border-transparent bg-[rgba(100,116,139,0.08)] text-[#64748b]',
};

// Parses "10 Aug 2026" style dates into a real Date for sorting — the mock
// data uses this short human-readable format consistently everywhere else
// in the app (Today's Patient header, etc.), so records mirrors it rather
// than introducing ISO strings just for this page.
function parseDisplayDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

const COL_WIDTH = {
  no: 'w-[3.5%]',
  mrn: 'w-[8%]',
  name: 'w-[17%]',
  demografi: 'w-[10%]',
  phone: 'w-[12%]',
  registered: 'w-[11%]',
  lastVisit: 'w-[11%]',
  visits: 'w-[9%]',
  action: 'w-[7%]',
};

const HEADER_CLASS = 'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

export default function Records() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? null;

  function handleViewPatient(patient) {
    setSelectedPatientId(patient.id);
    setDetailOpen(true);
  }

  // Real roster: patients from Supabase's `patients` table, with each
  // patient's visit history/last visit/total visits/upcoming appointments
  // derived from their real rows in `appointments` — replacing the old
  // fully-mocked RECORDS_PATIENTS_INITIAL array. Split on today's date: any
  // appointment dated today-or-earlier (and not Cancelled — a cancelled
  // slot never actually happened) counts as a past visit; anything dated
  // after today is an upcoming appointment.
  //
  // Note: `patients` in Supabase does NOT have a `patientType` column (the
  // mock data's "Umum/BPJS/Asuransi Swasta" field), and there's no
  // `clinical_notes` table yet — so diagnosis/prescription/payment per
  // visit aren't available from the database. Those fields are simply
  // omitted per visit (PatientDetailSheet already hides rows/badges for
  // any field that's undefined) rather than fabricated. handleAddClinicalNote
  // below still only updates local state for the same reason: there's
  // nowhere in Supabase yet to persist a clinical note.
  // `silent` skips the loading-spinner reset — used for the Realtime-
  // triggered background refreshes below, so a new appointment coming in
  // from another tab/browser updates the table in place instead of
  // flashing it back to "Memuat data pasien..." while a receptionist is
  // mid-search or has a detail sheet open.
  const loadPatients = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingPatients(true);
    }
    setLoadError(null);

    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id, mrn, name, category, gender, age, phone, address, registered_since, allergies, medical_notes')
      .order('registered_since', { ascending: false });

    if (patientsError) {
      console.error('Failed to load patients from Supabase', patientsError);
      setLoadError(patientsError.message);
      setLoadingPatients(false);
      toast.error('Gagal memuat data pasien dari database.');
      return;
    }

    const patientIds = (patientsData ?? []).map((p) => p.id);
    const appointmentsByPatient = {};

    if (patientIds.length > 0) {
      const { data: apptsData, error: apptsError } = await supabase
        .from('appointments')
        .select('id, patient_id, appt_date, dokter, keluhan, status')
        .in('patient_id', patientIds);

      if (apptsError) {
        // The patient roster itself loaded fine — don't fail the whole page
        // over visit history, just show it empty and say so.
        console.error('Failed to load visit history from Supabase', apptsError);
        toast.error('Data pasien dimuat, tapi riwayat kunjungan gagal dimuat.');
      } else {
        for (const appt of apptsData ?? []) {
          (appointmentsByPatient[appt.patient_id] ??= []).push(appt);
        }
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const nextPatients = (patientsData ?? []).map((p) => {
      const appts = appointmentsByPatient[p.id] ?? [];
      const past = appts
        .filter((a) => a.appt_date && a.appt_date <= todayStr && a.status !== 'Cancel')
        .sort((a, b) => (a.appt_date < b.appt_date ? 1 : a.appt_date > b.appt_date ? -1 : 0));
      const future = appts
        .filter((a) => a.appt_date && a.appt_date > todayStr)
        .sort((a, b) => (a.appt_date < b.appt_date ? -1 : a.appt_date > b.appt_date ? 1 : 0));

      return {
        id: p.id,
        mrn: p.mrn,
        name: p.name,
        category: p.category || 'Regular',
        gender: p.gender,
        age: p.age,
        phone: p.phone,
        address: p.address,
        registeredSince: formatDisplayDate(p.registered_since),
        lastVisit: past[0] ? formatDisplayDate(past[0].appt_date) : null,
        totalVisits: past.length,
        allergies: p.allergies ?? [],
        medicalNotes: p.medical_notes ?? [],
        visitHistory: past.map((a) => ({
          date: formatDisplayDate(a.appt_date),
          doctor: a.dokter && a.dokter !== '-' ? a.dokter : undefined,
          treatment: a.keluhan && a.keluhan !== '-' ? a.keluhan : undefined,
        })),
        appointments: future.map((a) => ({
          reason: a.keluhan && a.keluhan !== '-' ? a.keluhan : 'Appointment',
          doctor: a.dokter && a.dokter !== '-' ? a.dokter : undefined,
          date: formatDisplayDate(a.appt_date),
        })),
      };
    });

    setPatients(nextPatients);
    setLoadingPatients(false);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Keeps the roster live without a manual refresh: a new registration or
  // appointment booked anywhere else (another tab, another browser, the
  // Today's Patient page) pushes a Postgres change event here, and the
  // whole list is silently recomputed from Supabase. Without this, Records
  // only reflects the database as of whenever this page happened to mount
  // — which is exactly what made it look "out of sync" with Today's
  // Patient right after booking a same-day appointment for someone whose
  // Records tab was already open. Debounced by 300ms so a registration
  // (an insert into `patients` immediately followed by one into
  // `appointments`) triggers one reload, not two back-to-back.
  //
  // Requires `patients` and `appointments` to be added to Supabase's
  // realtime publication (same migration `remarks` needed earlier):
  //   alter publication supabase_realtime add table patients;
  //   alter publication supabase_realtime add table appointments;
  // If either was already added (e.g. `appointments` for some other
  // feature), Postgres will just say so — safe to ignore.
  useEffect(() => {
    let debounceTimer = null;
    const scheduleReload = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadPatients({ silent: true }), 300);
    };

    const channel = supabase
      .channel('records-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, scheduleReload)
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadPatients]);

  // Lets a Doctor append a new clinical note (diagnosis + prescription) to
  // a patient's visit history directly from the Clinical tab — the tab was
  // previously read-only, which meant "Rekam Medis" could show past visits
  // but a doctor had no way to actually record today's. New entries are
  // unshifted to the front so the most recent note always shows first,
  // matching how visitHistory is already ordered everywhere else.
  //
  // Still local-state-only, same as before this page was connected to
  // Supabase: there's no `clinical_notes` table yet to persist this to, so
  // a saved note (unlike the rest of this page's data) won't survive a
  // refresh or show up in another browser.
  function handleAddClinicalNote(patientId, note) {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, visitHistory: [note, ...(p.visitHistory ?? [])], lastVisit: note.date, totalVisits: p.totalVisits + 1 }
          : p
      )
    );
    toast.success('Catatan klinis berhasil disimpan');
  }

  const visiblePatients = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    let result = patients.filter((p) => {
      const matchesQuery =
        !trimmed ||
        p.name.toLowerCase().includes(trimmed) ||
        p.mrn.toLowerCase().includes(trimmed) ||
        (p.phone ?? '').replace(/-/g, '').includes(trimmed.replace(/-/g, ''));
      const matchesCategory = categoryFilter === 'Semua' || p.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
      return parseDisplayDate(b.registeredSince) - parseDisplayDate(a.registeredSince);
    });

    return result;
  }, [patients, query, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const total = patients.length;
    const categoryBreakdown = ['VVIP', 'VIP', 'Regular'].map((category) => ({
      category,
      value: patients.filter((p) => p.category === category).length,
    }));
    const priorityList = patients.filter((p) => p.category !== 'Regular').sort(
      (a, b) => parseDisplayDate(b.registeredSince) - parseDisplayDate(a.registeredSince)
    );
    const now = new Date();
    const newThisMonthList = patients.filter((p) => {
      const d = new Date(p.registeredSince);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const avgVisits = total
      ? (patients.reduce((sum, p) => sum + p.totalVisits, 0) / total).toFixed(1)
      : '0';
    const topVisits = [...patients].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 5);
    return {
      total,
      priority: priorityList.length,
      priorityList,
      categoryBreakdown,
      newThisMonth: newThisMonthList.length,
      newThisMonthList,
      avgVisits,
      topVisits,
    };
  }, [patients]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f5f6f8] lg:flex-row">
      <AppSidebar activeKey="records" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header — same shell as Today's Patient for visual consistency */}
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Records</h1>
            <span className="truncate text-sm text-slate-500">Data Master Pasien</span>
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

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          {/* Overview stat row — same expandable StatCard format used on
              Today's Patient, so every page's summary row reads identically. */}
          <div className="flex w-full flex-col gap-3">
            <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

            <div className="flex w-full flex-wrap items-start gap-4">
              <StatCard
                icon={<Users className="size-4" />}
                title="Total Pasien Terdaftar"
                count={stats.total}
                showDetail={showDetail}
              >
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {stats.categoryBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2"
                    >
                      <p className="text-xl font-semibold text-slate-800">{item.value}</p>
                      <div className="flex items-center gap-1">
                        <span className={cn('size-1.5 rounded-full', CATEGORY_DOT[item.category])} />
                        <span className="text-[11px] font-medium text-slate-500">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<Star className="size-4" />}
                title="Pasien VIP & VVIP"
                count={stats.priority}
                showDetail={showDetail}
              >
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.priorityList.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="truncate font-medium text-slate-700">{p.name}</span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          p.category === 'VVIP' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        )}
                      >
                        {p.category}
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<UserPlus className="size-4" />}
                title="Pasien Baru Bulan Ini"
                count={stats.newThisMonth}
                showDetail={showDetail}
              >
                {stats.newThisMonthList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Belum ada pasien baru bulan ini.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.newThisMonthList.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <span className="shrink-0 text-slate-400">{p.registeredSince}</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<Repeat2 className="size-4" />}
                title="Rata-rata Kunjungan"
                count={stats.avgVisits}
                showDetail={showDetail}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Kunjungan Terbanyak
                </p>
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.topVisits.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="truncate font-medium text-slate-700">{p.name}</span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {p.totalVisits}x
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">
                Showing {visiblePatients.length} of {patients.length} entries
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-[280px] max-w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama, No. RM, atau telepon"
                    aria-label="Cari pasien berdasarkan nama, No. RM, atau telepon"
                    className="h-10 rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-10 pr-9 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 rounded-3xl border-[#e2e8f0] px-4 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_FILTERS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'Semua' ? 'Semua Kategori' : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 rounded-3xl border-[#e2e8f0] px-4 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Patients table */}
            <div className="w-full min-w-0 overflow-x-auto">
              <Table className="table-fixed min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.no, 'text-left')}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.mrn, 'text-left')}>No. RM</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.name, 'text-left')}>Nama Pasien</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.demografi, 'text-left')}>Usia/Gender</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.phone, 'text-left')}>No. Telepon</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.registered, 'text-left')}>Terdaftar Sejak</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.lastVisit, 'text-left')}>Kunjungan Terakhir</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.visits, 'text-left')}>Total Kunjungan</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.action, 'text-left')}>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePatients.map((patient, index) => (
                    <TableRow
                      key={patient.id}
                      className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}
                    >
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.mrn}</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <div className="flex items-center gap-2">
                          <PatientNameHoverCard name={patient.name} category={patient.category} />
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                              CATEGORY_BADGE[patient.category] ?? CATEGORY_BADGE.Regular
                            )}
                          >
                            {patient.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">
                        {patient.age != null ? `${patient.age} Thn` : '-'} &middot;{' '}
                        {patient.gender === 'Laki-laki' ? 'L' : patient.gender === 'Perempuan' ? 'P' : '-'}
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.phone || '-'}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.registeredSince || '-'}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.lastVisit || '-'}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.totalVisits}x</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <button
                          type="button"
                          aria-label={`View ${patient.name}`}
                          onClick={() => handleViewPatient(patient)}
                          className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visiblePatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-16 text-left text-[#64748b]">
                        {loadingPatients
                          ? 'Memuat data pasien...'
                          : loadError
                            ? `Gagal memuat data pasien: ${loadError}`
                            : 'Tidak ada pasien yang cocok dengan pencarian/filter ini.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <PatientDetailSheet
            patient={selectedPatient}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onAddClinicalNote={handleAddClinicalNote}
          />
        </main>
      </div>
    </div>
  );
}
