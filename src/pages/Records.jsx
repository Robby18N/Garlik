import { useMemo, useState } from 'react';
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

const CATEGORY_DOT = { VVIP: 'bg-amber-500', VIP: 'bg-green-500', Regular: 'bg-slate-400' };

// Master patient records — a persistent roster independent of any single
// day's schedule (unlike Today's Patient), enriched with the fields the
// Records menu is scoped to show: MR number, demographics, registration
// date, visit history (with payment status per visit for Billing context),
// basic medical background (allergies/conditions, read-only here), and
// per-visit clinical notes gated to the Doctor role in PatientDetailSheet.
const RECORDS_PATIENTS_INITIAL = [
  {
    id: 1, mrn: 'P-0001', name: 'Agung Wijaya Kusuma', category: 'VIP', gender: 'Laki-laki', age: 34,
    phone: '0813-2037-6091', address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
    patientType: 'Umum', registeredSince: '14 Jan 2023', lastVisit: '10 Aug 2026', totalVisits: 9,
    allergies: ['Penisilin'], medicalNotes: ['Hipertensi'],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. SM', treatment: 'Scaling', payment: 'Paid', diagnosis: 'Karang gigi ringan', prescription: 'Obat kumur antiseptik' },
      { date: '02 May 2026', doctor: 'drg. SM', treatment: 'Tambal Gigi', payment: 'Paid', diagnosis: 'Karies dentin M1 kanan bawah', prescription: 'Asam mefenamat 500mg 3x1' },
      { date: '18 Jan 2026', doctor: 'drg. AN', treatment: 'Konsultasi', payment: 'Paid', diagnosis: 'Gigi sensitif', prescription: 'Pasta gigi sensitif' },
    ],
    appointments: [{ reason: 'Kontrol Scaling', doctor: 'drg. SM', date: '20 Nov 2026' }],
  },
  {
    id: 2, mrn: 'P-0002', name: 'Siti Rahmawati', category: 'Regular', gender: 'Perempuan', age: 27,
    phone: '0821-2074-6182', address: 'Jl. Melati No. 4, Bandung',
    patientType: 'BPJS', registeredSince: '02 Mar 2024', lastVisit: '10 Aug 2026', totalVisits: 4,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. AN', treatment: 'Tambal Gigi', payment: 'Paid', diagnosis: 'Karies email M2 kiri atas', prescription: 'Tidak ada' },
      { date: '15 Feb 2026', doctor: 'drg. AN', treatment: 'Konsultasi', payment: 'Paid', diagnosis: 'Gigi berlubang awal', prescription: 'Fluoride topikal' },
    ],
    appointments: [],
  },
  {
    id: 3, mrn: 'P-0003', name: 'Budi Santoso', category: 'Regular', gender: 'Laki-laki', age: 41,
    phone: '0822-2111-6273', address: 'Jl. Sudirman No. 88, Jakarta Pusat',
    patientType: 'Umum', registeredSince: '20 Jun 2022', lastVisit: '10 Aug 2026', totalVisits: 12,
    allergies: [], medicalNotes: ['Diabetes Tipe 2'],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. SM', treatment: 'Scaling', payment: 'Unpaid', diagnosis: 'Karang gigi sedang', prescription: 'Obat kumur antiseptik' },
      { date: '22 Mar 2026', doctor: 'drg. SM', treatment: 'Cabut Gigi', payment: 'Paid', diagnosis: 'Gigi bungsu impaksi', prescription: 'Amoxicillin 500mg 3x1, Asam mefenamat 500mg 3x1' },
    ],
    appointments: [],
  },
  {
    id: 4, mrn: 'P-0004', name: 'Dewi Lestari', category: 'VVIP', gender: 'Perempuan', age: 52,
    phone: '0851-2148-6364', address: 'Jl. Pahlawan No. 21, Surabaya',
    patientType: 'Asuransi Swasta', registeredSince: '05 Sep 2021', lastVisit: '10 Aug 2026', totalVisits: 21,
    allergies: ['Lateks'], medicalNotes: ['Osteoporosis'],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. RF', treatment: 'Sakit Gigi', payment: 'Paid', diagnosis: 'Pulpitis reversibel M1 kiri bawah', prescription: 'Asam mefenamat 500mg 3x1' },
      { date: '01 Jun 2026', doctor: 'drg. RF', treatment: 'Whitening', payment: 'Paid', diagnosis: 'Diskolorasi ekstrinsik', prescription: 'Tidak ada' },
      { date: '14 Feb 2026', doctor: 'drg. RF', treatment: 'Konsultasi', payment: 'Paid', diagnosis: 'Evaluasi rutin', prescription: 'Tidak ada' },
    ],
    appointments: [{ reason: 'Kontrol Pulpitis', doctor: 'drg. RF', date: '25 Aug 2026' }],
  },
  {
    id: 5, mrn: 'P-0005', name: 'Andi Pratama', category: 'Regular', gender: 'Laki-laki', age: 19,
    phone: '0852-2185-6455', address: 'Jl. Anggrek No. 7, Depok',
    patientType: 'Umum', registeredSince: '11 Nov 2025', lastVisit: '10 Aug 2026', totalVisits: 2,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. AN', treatment: 'Tambal Gigi', payment: 'Partial', diagnosis: 'Karies dentin P1 kanan atas', prescription: 'Tidak ada' },
    ],
    appointments: [],
  },
  {
    id: 6, mrn: 'P-0006', name: 'Rina Marlina', category: 'VIP', gender: 'Perempuan', age: 30,
    phone: '0895-2222-6546', address: 'Jl. Cendrawasih No. 15, Bekasi',
    patientType: 'Umum', registeredSince: '30 Jul 2023', lastVisit: '10 Aug 2026', totalVisits: 7,
    allergies: ['Ibuprofen'], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. SM', treatment: 'Gigi Sensitif', payment: 'Paid', diagnosis: 'Resesi gingiva ringan', prescription: 'Pasta gigi sensitif' },
      { date: '19 Apr 2026', doctor: 'drg. SM', treatment: 'Scaling', payment: 'Paid', diagnosis: 'Karang gigi ringan', prescription: 'Obat kumur antiseptik' },
    ],
    appointments: [],
  },
  {
    id: 7, mrn: 'P-0007', name: 'Fajar Hidayat', category: 'Regular', gender: 'Laki-laki', age: 45,
    phone: '0896-2259-6637', address: 'Jl. Diponegoro No. 33, Semarang',
    patientType: 'BPJS', registeredSince: '08 Apr 2022', lastVisit: '10 Aug 2026', totalVisits: 15,
    allergies: [], medicalNotes: ['Hipertensi'],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. RF', treatment: 'Cabut Gigi', payment: 'Paid', diagnosis: 'Gigi bungsu impaksi parsial', prescription: 'Amoxicillin 500mg 3x1' },
    ],
    appointments: [],
  },
  {
    id: 8, mrn: 'P-0008', name: 'Nur Aisyah', category: 'Regular', gender: 'Perempuan', age: 23,
    phone: '0812-2296-6728', address: 'Jl. Kenanga No. 9, Tangerang',
    patientType: 'Umum', registeredSince: '17 Dec 2024', lastVisit: '10 Aug 2026', totalVisits: 3,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. AN', treatment: 'Karang Gigi', payment: 'Paid', diagnosis: 'Karang gigi ringan', prescription: 'Tidak ada' },
    ],
    appointments: [],
  },
  {
    id: 9, mrn: 'P-0009', name: 'Dimas Saputra', category: 'Regular', gender: 'Laki-laki', age: 29,
    phone: '0813-2333-6819', address: 'Jl. Flamboyan No. 5, Bogor',
    patientType: 'Umum', registeredSince: '25 Aug 2023', lastVisit: '10 Aug 2026', totalVisits: 6,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. SM', treatment: 'Gigi Berlubang', payment: 'Unpaid', diagnosis: 'Karies dentin M2 kiri bawah', prescription: 'Asam mefenamat 500mg 3x1' },
    ],
    appointments: [],
  },
  {
    id: 10, mrn: 'P-0010', name: 'Maya Sari', category: 'Regular', gender: 'Perempuan', age: 37,
    phone: '0821-2370-6910', address: 'Jl. Teratai No. 18, Jakarta Timur',
    patientType: 'Asuransi Swasta', registeredSince: '13 Feb 2024', lastVisit: '10 Aug 2026', totalVisits: 5,
    allergies: ['Sulfa'], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. RF', treatment: 'Konsultasi', payment: 'Paid', diagnosis: 'Evaluasi rutin', prescription: 'Tidak ada' },
    ],
    appointments: [],
  },
  {
    id: 11, mrn: 'P-0011', name: 'Putri Amelia', category: 'VIP', gender: 'Perempuan', age: 26,
    phone: '0851-2444-7092', address: 'Jl. Mawar No. 2, Jakarta Selatan',
    patientType: 'Umum', registeredSince: '19 May 2023', lastVisit: '10 Aug 2026', totalVisits: 8,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. SM', treatment: 'Whitening', payment: 'Paid', diagnosis: 'Diskolorasi ekstrinsik', prescription: 'Tidak ada' },
    ],
    appointments: [{ reason: 'Whitening Sesi 2', doctor: 'drg. SM', date: '30 Aug 2026' }],
  },
  {
    id: 12, mrn: 'P-0012', name: 'Arif Setiawan', category: 'Regular', gender: 'Laki-laki', age: 48,
    phone: '0852-2481-7183', address: 'Jl. Kamboja No. 11, Malang',
    patientType: 'Umum', registeredSince: '02 Feb 2022', lastVisit: '10 Aug 2026', totalVisits: 18,
    allergies: [], medicalNotes: ['Jantung Koroner'],
    visitHistory: [
      { date: '10 Aug 2026', doctor: 'drg. RF', treatment: 'Gigi Patah', payment: 'Paid', diagnosis: 'Fraktur mahkota M1 kanan atas', prescription: 'Asam mefenamat 500mg 3x1' },
    ],
    appointments: [],
  },
  {
    id: 13, mrn: 'P-0013', name: 'Hendra Gunawan', category: 'Regular', gender: 'Laki-laki', age: 15,
    phone: '0852-5737-6191', address: 'Jl. Beringin No. 3, Tangerang Selatan',
    patientType: 'Umum', registeredSince: '28 Jul 2025', lastVisit: '05 Jul 2026', totalVisits: 3,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '05 Jul 2026', doctor: 'drg. SM', treatment: 'Kontrol Kawat Gigi', payment: 'Paid', diagnosis: 'Kontrol rutin ortodonti', prescription: 'Tidak ada' },
    ],
    appointments: [{ reason: 'Kontrol Kawat Gigi', doctor: 'drg. SM', date: '15 Aug 2026' }],
  },
  {
    id: 14, mrn: 'P-0014', name: 'Melati Suryani', category: 'VIP', gender: 'Perempuan', age: 33,
    phone: '0895-5774-6282', address: 'Jl. Cempaka No. 6, Jakarta Barat',
    patientType: 'Asuransi Swasta', registeredSince: '09 Oct 2023', lastVisit: '28 Jun 2026', totalVisits: 10,
    allergies: ['Codein'], medicalNotes: [],
    visitHistory: [
      { date: '28 Jun 2026', doctor: 'drg. AN', treatment: 'Cabut Gigi Bungsu', payment: 'Paid', diagnosis: 'Gigi bungsu impaksi total', prescription: 'Amoxicillin 500mg 3x1, Asam mefenamat 500mg 3x1' },
    ],
    appointments: [],
  },
  {
    id: 15, mrn: 'P-0015', name: 'Bayu Kusnandar', category: 'Regular', gender: 'Laki-laki', age: 40,
    phone: '0896-5811-6373', address: 'Jl. Nusa Indah No. 14, Cimahi',
    patientType: 'BPJS', registeredSince: '16 Jan 2026', lastVisit: '14 Jul 2026', totalVisits: 2,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '14 Jul 2026', doctor: 'drg. RF', treatment: 'Gigi Berlubang', payment: 'Paid', diagnosis: 'Karies dentin M1 kiri bawah', prescription: 'Tidak ada' },
    ],
    appointments: [],
  },
  {
    id: 16, mrn: 'P-0016', name: 'Citra Dewanti', category: 'VVIP', gender: 'Perempuan', age: 29,
    phone: '0812-5848-6464', address: 'Jl. Dahlia No. 20, Jakarta Selatan',
    patientType: 'Umum', registeredSince: '03 Aug 2026', lastVisit: '03 Aug 2026', totalVisits: 1,
    allergies: [], medicalNotes: [],
    visitHistory: [
      { date: '03 Aug 2026', doctor: 'drg. SM', treatment: 'Whitening', payment: 'Paid', diagnosis: 'Diskolorasi ekstrinsik', prescription: 'Tidak ada' },
    ],
    appointments: [{ reason: 'Whitening Sesi 2', doctor: 'drg. SM', date: '22 Aug 2026' }],
  },
];

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
  const [patients, setPatients] = useState(RECORDS_PATIENTS_INITIAL);
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

  // Lets a Doctor append a new clinical note (diagnosis + prescription) to
  // a patient's visit history directly from the Clinical tab — the tab was
  // previously read-only, which meant "Rekam Medis" could show past visits
  // but a doctor had no way to actually record today's. New entries are
  // unshifted to the front so the most recent note always shows first,
  // matching how visitHistory is already ordered everywhere else.
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
        p.phone.replace(/-/g, '').includes(trimmed.replace(/-/g, ''));
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
    const newThisMonthList = patients.filter((p) => {
      const d = new Date(p.registeredSince);
      return d.getFullYear() === 2026 && d.getMonth() === 7; // August 2026
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
                        {patient.age} Thn &middot; {patient.gender === 'Laki-laki' ? 'L' : 'P'}
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.phone}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.registeredSince}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{patient.lastVisit}</TableCell>
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
                        Tidak ada pasien yang cocok dengan pencarian/filter ini.
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
