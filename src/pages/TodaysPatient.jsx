import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Bell, Search, Plus, Share2, Eye, Pencil, ArrowUpDown, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppSidebar from '@/components/app-sidebar';
import SummaryCards from '@/components/summary-cards';
import PatientNameHoverCard from '@/components/patient-name-hover-card';
import PatientDetailSheet from '@/components/patient-detail-sheet';
import SearchPatientDialog from '@/components/search-patient-dialog';
import MrCheckIcon from '@/components/mr-check-icon';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  Complete: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Late: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Cancel: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  'Waiting 10 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  'Waiting 20 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

// Full 21-row list matching Figma node 576:3192 exactly (names, times,
// status and remarks all taken 1:1 from the reference frame). `mr` is
// the MR column icon variant (1 = rare filled badge, 2 = common
// double-check, 3 = triple/wave check) matching node 583:4809 —
// distribution mirrors the asset frequency seen across the 21 rows.
const MOCK_PATIENTS = [
  { id: 1, mr: 1, appt: '08:30', name: 'Agung Wijaya Kusuma', category: 'VIP', dokter: 'drg. SM', room: 'R1', keluhan: 'Gigi Ngilu / Sensitive', durasi: '45 Min', status: 'Complete', lab: 'OK', remark: 'Pasien sudah mengeluh ingin segera di treatment' },
  { id: 2, mr: 2, appt: '08:45', name: 'Siti Rahmawati', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Gigi Berlubang', durasi: '60 Min', status: 'Waiting 10 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 3, mr: 3, appt: '09:00', name: 'Budi Santoso', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Scaling', durasi: '45 Min', status: 'Late', lab: 'NOK', remark: 'Pasien Telat Datang' },
  { id: 4, mr: 2, appt: '09:15', name: 'Dewi Lestari', category: 'VVIP', dokter: 'drg. RF', room: 'R3', keluhan: 'Sakit Gigi', durasi: '60 Min', status: 'Cancel', lab: 'NOK', remark: 'Pasien Kondusif' },
  { id: 5, mr: 2, appt: '09:30', name: 'Andi Pratama', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Tambal Gigi', durasi: '45 Min', status: 'Waiting 10 Min', lab: 'OK', remark: 'Waktu tunggu meningkat, berpotensi menghambat antrian' },
  { id: 6, mr: 2, appt: '09:45', name: 'Rina Marlina', category: 'VIP', dokter: 'drg. SM', room: 'R1', keluhan: 'Gigi Sensitif', durasi: '30 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Proses berjalan sesuai estimasi, antrian kondusif' },
  { id: 7, mr: 3, appt: '10:00', name: 'Fajar Hidayat', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Cabut Gigi', durasi: '60 Min', status: 'Waiting 10 Min', lab: 'OK', remark: 'Pasien belum dipanggil, antrian mulai padat' },
  { id: 8, mr: 2, appt: '10:15', name: 'Nur Aisyah', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Karang Gigi', durasi: '45 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 9, mr: 2, appt: '10:30', name: 'Dimas Saputra', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Gigi Berlubang', durasi: '60 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien sudah mengeluh ingin segera di treatment' },
  { id: 10, mr: 2, appt: '10:45', name: 'Maya Sari', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Konsultasi', durasi: '30 Min', status: 'Late', lab: 'NOK', remark: 'Pasien Telat Datang' },
  { id: 11, mr: 2, appt: '11:00', name: 'Rizky Ramadhan', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Sakit Gusi', durasi: '45 Min', status: 'Cancel', lab: 'NOK', remark: 'Pasien cancel' },
  { id: 12, mr: 2, appt: '11:15', name: 'Putri Amelia', category: 'VIP', dokter: 'drg. SM', room: 'R1', keluhan: 'Whitening', durasi: '90 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 13, mr: 2, appt: '11:30', name: 'Arif Setiawan', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Gigi Patah', durasi: '60 Min', status: 'Waiting 10 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 14, mr: 2, appt: '11:45', name: 'Lina Wulandari', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Scaling', durasi: '45 Min', status: 'Waiting 10 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 15, mr: 2, appt: '12:00', name: 'Yoga Pratama', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Tambal Gigi', durasi: '45 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Waktu tunggu meningkat, berpotensi menghambat antrian' },
  { id: 16, mr: 3, appt: '13:00', name: 'Intan Permata', category: 'VVIP', dokter: 'drg. RF', room: 'R3', keluhan: 'Gigi Ngilu', durasi: '30 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien sudah mengeluh ingin segera di treatment' },
  { id: 17, mr: 2, appt: '13:15', name: 'Wahyu Nugroho', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Gigi Berlubang', durasi: '60 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien belum dipanggil, antrian mulai padat' },
  { id: 18, mr: 2, appt: '13:30', name: 'Nadia Putri', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Konsultasi', durasi: '30 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 19, mr: 2, appt: '13:45', name: 'Ilham Maulana', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Cabut Gigi', durasi: '60 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 20, mr: 2, appt: '14:00', name: 'Vina Oktaviani', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Karang Gigi', durasi: '45 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 21, mr: 2, appt: '14:15', name: 'Reza Kurniawan', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Sakit Gigi', durasi: '60 Min', status: 'Waiting 20 Min', lab: 'OK', remark: 'Pasien Kondusif' },
];

// Tomorrow's schedule — a different set of booked patients. None of these
// appointments have happened yet, so there is no Complete/Late/Waiting
// status to show; the Status column renders "-" for every row instead
// (handled in the Status cell below, keyed off `dayFilter`).
const MOCK_PATIENTS_TOMORROW = [
  { id: 101, mr: 2, appt: '08:00', name: 'Hendra Gunawan', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Kontrol Kawat Gigi', durasi: '30 Min', status: null, lab: 'OK', remark: 'Jadwal kontrol rutin' },
  { id: 102, mr: 1, appt: '08:30', name: 'Melati Suryani', category: 'VIP', dokter: 'drg. AN', room: 'R2', keluhan: 'Cabut Gigi Bungsu', durasi: '90 Min', status: null, lab: 'OK', remark: 'Pasien minta anestesi ringan' },
  { id: 103, mr: 2, appt: '09:00', name: 'Bayu Kusnandar', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Gigi Berlubang', durasi: '45 Min', status: null, lab: 'NOK', remark: 'Perlu rontgen dulu' },
  { id: 104, mr: 3, appt: '09:30', name: 'Citra Dewanti', category: 'VVIP', dokter: 'drg. SM', room: 'R1', keluhan: 'Whitening', durasi: '90 Min', status: null, lab: 'OK', remark: 'Booking dari kemarin' },
  { id: 105, mr: 2, appt: '10:00', name: 'Doni Firmansyah', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Scaling', durasi: '45 Min', status: null, lab: 'OK', remark: 'Pasien baru' },
  { id: 106, mr: 2, appt: '10:30', name: 'Eka Purnama', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Sakit Gusi', durasi: '30 Min', status: null, lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 107, mr: 2, appt: '11:00', name: 'Galih Prasetyo', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Tambal Gigi', durasi: '45 Min', status: null, lab: 'OK', remark: 'Reschedule dari minggu lalu' },
  { id: 108, mr: 2, appt: '11:30', name: 'Herlina Wati', category: 'VIP', dokter: 'drg. AN', room: 'R2', keluhan: 'Konsultasi Behel', durasi: '30 Min', status: null, lab: 'OK', remark: 'Konsultasi pertama' },
  { id: 109, mr: 2, appt: '13:00', name: 'Indra Gunawan', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Gigi Ngilu', durasi: '45 Min', status: null, lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 110, mr: 2, appt: '13:30', name: 'Jasmine Anggraini', category: 'Regular', dokter: 'drg. SM', room: 'R1', keluhan: 'Karang Gigi', durasi: '45 Min', status: null, lab: 'OK', remark: 'Pasien Kondusif' },
  { id: 111, mr: 2, appt: '14:00', name: 'Krisna Ardiansyah', category: 'Regular', dokter: 'drg. AN', room: 'R2', keluhan: 'Cabut Gigi', durasi: '60 Min', status: null, lab: 'NOK', remark: 'Perlu rontgen dulu' },
  { id: 112, mr: 2, appt: '14:30', name: 'Lestari Handayani', category: 'Regular', dokter: 'drg. RF', room: 'R3', keluhan: 'Sakit Gigi', durasi: '60 Min', status: null, lab: 'OK', remark: 'Pasien Kondusif' },
];

// Column widths as percentages of the table, proportional to Figma node
// 576:3192's `.Table Heading` frame widths (43/47/80/180/80/80/160/80/
// 138/50/300 out of 1325, Action taking the remainder). Using percentages
// instead of hard pixel widths means the table always scales to fit its
// container — no column (in particular Action, at the far right) ever
// gets cut off regardless of viewport width.
const COL_WIDTH = {
  no: 'w-[3.25%]',
  mr: 'w-[3.55%]',
  appt: 'w-[6.04%]',
  name: 'w-[13.58%]',
  dokter: 'w-[6.04%]',
  room: 'w-[6.04%]',
  keluhan: 'w-[12.08%]',
  durasi: 'w-[6.04%]',
  status: 'w-[10.42%]',
  lab: 'w-[3.77%]',
  remark: 'w-[22.64%]',
  action: 'w-[6.57%]',
};

const HEADER_CLASS =
  'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

export default function TodaysPatient() {
  const navigate = useNavigate();
  const [dayFilter, setDayFilter] = useState('Today');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [apptSortAsc, setApptSortAsc] = useState(true);
  // Remark column is freely editable per row — seeded from the mock data
  // (both Today's and Tomorrow's schedules), keyed by patient id so edits
  // survive sorting/filtering/switching days.
  const [remarks, setRemarks] = useState(() =>
    Object.fromEntries(
      [...MOCK_PATIENTS, ...MOCK_PATIENTS_TOMORROW].map((p) => [p.id, p.remark])
    )
  );

  function handleViewPatient(patient) {
    setSelectedPatient(patient);
    setDetailOpen(true);
  }

  const visiblePatients = useMemo(() => {
    const source = dayFilter === 'Tomorrow' ? MOCK_PATIENTS_TOMORROW : MOCK_PATIENTS;
    const filtered = nameQuery.trim()
      ? source.filter((p) => p.name.toLowerCase().includes(nameQuery.trim().toLowerCase()))
      : source;
    return [...filtered].sort((a, b) =>
      apptSortAsc ? a.appt.localeCompare(b.appt) : b.appt.localeCompare(a.appt)
    );
  }, [dayFilter, nameQuery, apptSortAsc]);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="patients" width={60} />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Today’s Patient</h1>
            <span className="text-sm text-slate-500">Wed 12 Aug 2026</span>
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
            <Avatar className="size-[30px]">
              <AvatarFallback className="bg-green-100 text-green-700">RN</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page body */}
        <main className="flex flex-1 flex-col gap-4 p-6">
          <SummaryCards />

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            {/* Toolbar row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">
                Showing {visiblePatients.length} of 20 entries
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div
                  id="search-patient-trigger"
                  onClick={() => setSearchOpen(true)}
                  className="relative w-[300px] max-w-full cursor-pointer"
                >
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    readOnly
                    placeholder="Cari Pasien / ID Patient / Nomor Telp"
                    className="h-10 cursor-pointer rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-10 pr-4 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                  />
                </div>

                <Button
                  onClick={() => navigate('/registration', { state: { flow: 'new-registration' } })}
                  className="h-9 rounded-3xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Plus className="size-4" />
                  New Registration
                </Button>

                <Button className="h-9 rounded-3xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                  <Share2 className="size-4" />
                  Rooms &amp; Labs
                </Button>

                {/* Today / Tomorrow toggle, matching Figma node 576:3118 — the switch
                    track is always blue (#3b82f6) regardless of on/off state. */}
                <div className="flex h-10 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4">
                  <span className="text-sm font-medium text-slate-950">Today</span>
                  <Switch
                    checked={dayFilter === 'Tomorrow'}
                    onCheckedChange={(checked) => setDayFilter(checked ? 'Tomorrow' : 'Today')}
                    className="data-[state=checked]:bg-[#3b82f6] data-[state=unchecked]:bg-[#3b82f6]"
                  />
                  <span className="text-sm font-medium text-slate-950">Tomorrow</span>
                </div>
              </div>
            </div>

            {/* Patients table — fixed column widths matching Figma node 576:3192 */}
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.no, 'text-left')}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.mr, 'text-left')}>MR</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.appt)}>
                      <button
                        type="button"
                        onClick={() => setApptSortAsc((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-inherit"
                        aria-label="Sort by appointment time"
                      >
                        Appt
                        <ArrowUpDown className={cn('size-3.5', apptSortAsc ? 'text-[#15803d]' : 'text-[#86efac]')} />
                      </button>
                    </TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.name)}>
                      {/* Caption always stays "Patient Name" — clicking the icon opens
                          a real (Radix) popover with the search function, so the
                          column label never disappears and clicking elsewhere in the
                          table (e.g. a row below) correctly dismisses it. */}
                      <Popover open={nameSearchOpen} onOpenChange={setNameSearchOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-inherit"
                            aria-label="Search patient name"
                          >
                            <Search className="size-3.5 shrink-0" />
                            Patient Name
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-[220px] border-none bg-transparent p-0 shadow-none"
                        >
                          {/* Pill search input matching Figma's Input component
                              (node 576:3122): white rounded-full, border #e2e8f0,
                              shadow-xs. */}
                          <div className="flex h-9 items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)]">
                            <Search className="size-3.5 shrink-0 text-[#64748b]" />
                            <input
                              autoFocus
                              value={nameQuery}
                              onChange={(e) => setNameQuery(e.target.value)}
                              placeholder="Cari nama pasien"
                              className="w-full min-w-0 bg-transparent text-xs font-normal text-[#020617] placeholder:text-[#64748b] focus:outline-none"
                            />
                            {nameQuery && (
                              <button
                                type="button"
                                aria-label="Clear name search"
                                onClick={() => setNameQuery('')}
                              >
                                <X className="size-3.5 shrink-0 text-[#64748b]" />
                              </button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.dokter)}>Dokter</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.room)}>Room</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.keluhan)}>Keluhan</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.durasi)}>Est. Dur</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.status)}>Status</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.lab)}>Lab</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.remark)}>Remark</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.action, 'text-left')}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePatients.map((patient, index) => (
                    <TableRow
                      key={patient.id}
                      className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}
                    >
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-top py-3 text-left">
                        <div className="flex items-center justify-start">
                          <MrCheckIcon variant={patient.mr} />
                        </div>
                      </TableCell>
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{patient.appt}</TableCell>
                      <TableCell className="!align-top py-3 text-left">
                        <PatientNameHoverCard name={patient.name} category={patient.category} />
                      </TableCell>
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{patient.dokter}</TableCell>
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{patient.room}</TableCell>
                      <TableCell className="!align-top py-3 whitespace-normal text-left text-[#334155]">
                        {patient.keluhan}
                      </TableCell>
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{patient.durasi}</TableCell>
                      <TableCell className="!align-top py-3 text-left">
                        {patient.status ? (
                          <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[patient.status])}>
                            {patient.status}
                          </Badge>
                        ) : (
                          <span className="text-[#94a3b8]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="!align-top py-3 text-left text-[#334155]">{patient.lab}</TableCell>
                      <TableCell className="!align-top py-3 text-left">
                        {/* Free-text, auto-growing remark — height follows the number
                            of lines/paragraphs typed, and the row height (shared by
                            every cell above, all pinned to align-top) grows with it. */}
                        <textarea
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={remarks[patient.id] ?? ''}
                          onChange={(e) =>
                            setRemarks((prev) => ({ ...prev, [patient.id]: e.target.value }))
                          }
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          rows={1}
                          placeholder="Tulis remark..."
                          aria-label={`Remark for ${patient.name}`}
                          className="block w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent p-1 text-left text-sm text-[#334155] outline-none placeholder:text-slate-400 hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                        />
                      </TableCell>
                      <TableCell className="!align-top py-3 text-left">
                        <div className="flex items-center justify-start gap-2">
                          <button
                            type="button"
                            data-testid={`view-patient-${index}`}
                            aria-label={`View ${patient.name}`}
                            onClick={() => handleViewPatient(patient)}
                            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${patient.name}`}
                            onClick={() => console.log('edit patient', patient)}
                            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visiblePatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="h-16 text-center text-[#64748b]">
                        Tidak ada pasien dengan nama tersebut.
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
          />
          <SearchPatientDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </main>
      </div>
    </div>
  );
}
