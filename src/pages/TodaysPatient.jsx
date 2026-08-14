import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Bell, Search, Plus, Share2, Eye, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  Complete: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Late: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Cancel: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  'Waiting 10 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  'Waiting 20 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

// Mock data matching the columns seen in Figma node 469:3808
// (No, MR, Appt, Patient Name, Dokter, Room, Keluhan, Est. Dur, Status, Lab, Remark, Action).
const MOCK_PATIENTS = [
  {
    id: 1,
    mrChecked: true,
    appt: '08:30',
    name: 'Agung Wijaya Kusuma',
    category: 'VIP',
    dokter: 'drg. SM',
    room: 'R1',
    keluhan: 'Gigi Ngilu / Sensitive',
    durasi: '45 Min',
    status: 'Complete',
    lab: 'OK',
    remark: 'Pasien sudah mengeluh ingin segera di treatment',
  },
  {
    id: 2,
    mrChecked: true,
    appt: '08:45',
    name: 'Siti Rahmawati',
    category: 'Regular',
    dokter: 'drg. AN',
    room: 'R2',
    keluhan: 'Gigi Berlubang',
    durasi: '60 Min',
    status: 'Waiting 10 Min',
    lab: 'OK',
    remark: 'Pasien Kondusif',
  },
  {
    id: 3,
    mrChecked: true,
    appt: '09:00',
    name: 'Budi Santoso',
    category: 'Regular',
    dokter: 'drg. SM',
    room: 'R1',
    keluhan: 'Scaling',
    durasi: '45 Min',
    status: 'Late',
    lab: 'NOK',
    remark: 'Pasien Telat Datang',
  },
  {
    id: 4,
    mrChecked: true,
    appt: '09:15',
    name: 'Dewi Lestari',
    category: 'VVIP',
    dokter: 'drg. RF',
    room: 'R3',
    keluhan: 'Sakit Gigi',
    durasi: '60 Min',
    status: 'Cancel',
    lab: 'NOK',
    remark: 'Pasien Kondusif',
  },
  {
    id: 5,
    mrChecked: true,
    appt: '09:30',
    name: 'Andi Pratama',
    category: 'Regular',
    dokter: 'drg. AN',
    room: 'R2',
    keluhan: 'Tambal Gigi',
    durasi: '45 Min',
    status: 'Waiting 10 Min',
    lab: 'OK',
    remark: 'Waktu tunggu meningkat, berpotensi menghambat antrian',
  },
  {
    id: 6,
    mrChecked: true,
    appt: '09:45',
    name: 'Rina Marlina',
    category: 'VIP',
    dokter: 'drg. SM',
    room: 'R1',
    keluhan: 'Gigi Sensitif',
    durasi: '30 Min',
    status: 'Waiting 20 Min',
    lab: 'OK',
    remark: 'Proses berjalan sesuai estimasi, antrian kondusif',
  },
  {
    id: 7,
    mrChecked: true,
    appt: '10:00',
    name: 'Fajar Hidayat',
    category: 'Regular',
    dokter: 'drg. RF',
    room: 'R3',
    keluhan: 'Cabut Gigi',
    durasi: '60 Min',
    status: 'Waiting 10 Min',
    lab: 'OK',
    remark: 'Pasien belum dipanggil, antrian mulai padat',
  },
  {
    id: 8,
    mrChecked: true,
    appt: '10:15',
    name: 'Nur Aisyah',
    category: 'Regular',
    dokter: 'drg. AN',
    room: 'R2',
    keluhan: 'Karang Gigi',
    durasi: '45 Min',
    status: 'Waiting 20 Min',
    lab: 'OK',
    remark: 'Pasien Kondusif',
  },
];

export default function TodaysPatient() {
  const navigate = useNavigate();
  const [dayFilter, setDayFilter] = useState('Today');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  function handleViewPatient(patient) {
    setSelectedPatient(patient);
    setDetailOpen(true);
  }

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
              <p className="text-sm font-medium text-slate-500">
                Showing {MOCK_PATIENTS.length} of 20 entries
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  id="search-patient-trigger"
                  onClick={() => setSearchOpen(true)}
                  className="relative w-[300px] max-w-full cursor-pointer"
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    readOnly
                    placeholder="Cari Pasien / ID Patient / Nomor Telp"
                    className="h-10 cursor-pointer rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-none"
                  />
                </div>

                <Button
                  onClick={() => navigate('/registration', { state: { flow: 'new-registration' } })}
                  className="h-10 rounded-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Plus className="size-4" />
                  New Registration
                </Button>

                <Button className="h-10 rounded-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700">
                  <Share2 className="size-4" />
                  Rooms &amp; Labs
                </Button>

                {/* Today / Tomorrow real switch, matching Figma's Switch component (node 511:5824) */}
                <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3">
                  <span className={cn('text-sm font-medium', dayFilter === 'Today' ? 'text-slate-900' : 'text-slate-400')}>
                    Today
                  </span>
                  <Switch
                    checked={dayFilter === 'Tomorrow'}
                    onCheckedChange={(checked) => setDayFilter(checked ? 'Tomorrow' : 'Today')}
                  />
                  <span className={cn('text-sm font-medium', dayFilter === 'Tomorrow' ? 'text-slate-900' : 'text-slate-400')}>
                    Tomorrow
                  </span>
                </div>
              </div>
            </div>

            {/* Patients table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-[#020617]">No</TableHead>
                    <TableHead className="font-semibold text-[#020617]">MR</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Appt</TableHead>
                    <TableHead className="font-semibold text-[#020617]">
                      <span className="inline-flex items-center gap-1.5">
                        <Search className="size-3.5 text-slate-400" />
                        Patient Name
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-[#020617]">Dokter</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Room</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Keluhan</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Est. Dur</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Status</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Lab</TableHead>
                    <TableHead className="font-semibold text-[#020617]">Remark</TableHead>
                    <TableHead className="text-right font-semibold text-[#020617]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PATIENTS.map((patient, index) => (
                    <TableRow key={patient.id}>
                      <TableCell className="text-slate-600">{index + 1}</TableCell>
                      <TableCell>
                        {patient.mrChecked && (
                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            ✓
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.appt}</TableCell>
                      <TableCell>
                        <PatientNameHoverCard name={patient.name} category={patient.category} />
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.dokter}</TableCell>
                      <TableCell className="text-slate-600">{patient.room}</TableCell>
                      <TableCell className="whitespace-normal text-slate-600">
                        {patient.keluhan}
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.durasi}</TableCell>
                      <TableCell>
                        <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[patient.status])}>
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.lab}</TableCell>
                      <TableCell className="max-w-[280px] whitespace-normal text-slate-600">
                        {patient.remark}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
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
