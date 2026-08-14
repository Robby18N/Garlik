import { useMemo, useState } from 'react';
import { Moon, Bell, Search, Plus, Eye, Printer, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';

import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useRole, DOCTORS } from '@/context/role-context';
import { cn } from '@/lib/utils';

// Which patients each doctor can write a prescription for — same
// doctor/patient pairing already established in Today's Patient & Activity's
// mock data, trimmed to names only since that's all a prescription picker
// needs.
const PATIENTS_BY_DOCTOR = {
  'drg. SM': ['Agung Wijaya Kusuma', 'Budi Santoso', 'Rina Marlina', 'Dimas Saputra', 'Putri Amelia'],
  'drg. AN': ['Siti Rahmawati', 'Andi Pratama', 'Nur Aisyah', 'Lina Wulandari', 'Wahyu Nugroho'],
  'drg. RF': ['Dewi Lestari', 'Fajar Hidayat', 'Maya Sari', 'Arif Setiawan', 'Ilham Maulana'],
};

let nextId = 1000;

const RESEP_INITIAL = [
  {
    id: 1, date: '10 Aug 2026', patient: 'Agung Wijaya Kusuma', doctor: 'drg. SM',
    items: [{ obat: 'Asam Mefenamat 500mg', dosis: '3x1 sehari', instruksi: 'Sesudah makan' }],
    note: 'Kontrol kembali bila nyeri berlanjut.',
  },
  {
    id: 2, date: '10 Aug 2026', patient: 'Siti Rahmawati', doctor: 'drg. AN',
    items: [{ obat: 'Fluoride Topikal', dosis: '1x aplikasi', instruksi: 'Di klinik' }],
    note: 'Tidak ada.',
  },
  {
    id: 3, date: '05 Jul 2026', patient: 'Dewi Lestari', doctor: 'drg. RF',
    items: [
      { obat: 'Amoxicillin 500mg', dosis: '3x1 sehari', instruksi: 'Habiskan selama 5 hari' },
      { obat: 'Asam Mefenamat 500mg', dosis: '3x1 sehari', instruksi: 'Bila nyeri' },
    ],
    note: 'Kontrol 1 minggu lagi.',
  },
  {
    id: 4, date: '02 May 2026', patient: 'Budi Santoso', doctor: 'drg. SM',
    items: [{ obat: 'Obat Kumur Antiseptik', dosis: '2x sehari', instruksi: 'Kumur 30 detik' }],
    note: 'Tidak ada.',
  },
];

function emptyItem() {
  return { obat: '', dosis: '', instruksi: '' };
}

export default function Prescription() {
  const { role, doctorName } = useRole();
  const isDoctor = role === 'Doctor';

  const [resepList, setResepList] = useState(RESEP_INITIAL);
  const [query, setQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('Semua');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewResep, setViewResep] = useState(null);

  const [formPatient, setFormPatient] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formItems, setFormItems] = useState([emptyItem()]);

  const patientOptions = isDoctor ? PATIENTS_BY_DOCTOR[doctorName] ?? [] : [];

  const visibleResep = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return resepList
      .filter((r) => (isDoctor ? r.doctor === doctorName : doctorFilter === 'Semua' || r.doctor === doctorFilter))
      .filter((r) => !trimmed || r.patient.toLowerCase().includes(trimmed))
      .sort((a, b) => b.id - a.id);
  }, [resepList, query, doctorFilter, isDoctor, doctorName]);

  function openCreate() {
    setFormPatient(patientOptions[0] ?? '');
    setFormNote('');
    setFormItems([emptyItem()]);
    setCreateOpen(true);
  }

  function updateItem(index, field, value) {
    setFormItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItemRow() {
    setFormItems((prev) => [...prev, emptyItem()]);
  }

  function removeItemRow(index) {
    setFormItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSaveResep() {
    if (!formPatient || formItems.every((it) => !it.obat.trim())) {
      toast.error('Pilih pasien dan isi minimal satu obat.');
      return;
    }
    const validItems = formItems.filter((it) => it.obat.trim());
    const newResep = {
      id: nextId++,
      date: '14 Aug 2026',
      patient: formPatient,
      doctor: doctorName,
      items: validItems,
      note: formNote.trim() || 'Tidak ada.',
    };
    setResepList((prev) => [newResep, ...prev]);
    setCreateOpen(false);
    toast.success(`Resep untuk ${formPatient} berhasil disimpan`);
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="prescription" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">E-Resep</h1>
            <span className="text-sm text-slate-500">Resep Digital Pasien</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Toggle theme">
              <Moon className="size-4" />
            </button>
            <button type="button" className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <AccountMenu />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">
                Showing {visibleResep.length} of {resepList.filter((r) => (isDoctor ? r.doctor === doctorName : true)).length} entries
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-[240px] max-w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama pasien"
                    className="h-10 rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-10 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                  />
                </div>

                {!isDoctor && (
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="h-10 rounded-3xl border-[#e2e8f0] px-4 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semua">Semua Dokter</SelectItem>
                      {DOCTORS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {isDoctor && (
                  <Button
                    onClick={openCreate}
                    className="h-10 rounded-full bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Plus className="size-4" />
                    Buat Resep Baru
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[5%]">No</TableHead>
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[12%]">Tanggal</TableHead>
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[18%]">Pasien</TableHead>
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[12%]">Dokter</TableHead>
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[35%]">Obat</TableHead>
                    <TableHead className="h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d] w-[8%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleResep.map((r, index) => (
                    <TableRow key={r.id} className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{r.date}</TableCell>
                      <TableCell className="!align-middle py-3 text-left font-medium text-[#334155]">{r.patient}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{r.doctor}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">
                        <div className="flex flex-wrap gap-1">
                          {r.items.map((it, i) => (
                            <Badge key={i} variant="outline" className="rounded-full border-slate-200 text-[11px] font-medium text-slate-600">
                              {it.obat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <button
                          type="button"
                          aria-label={`Lihat resep ${r.patient}`}
                          onClick={() => setViewResep(r)}
                          className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleResep.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-16 text-left text-[#64748b]">
                        Belum ada resep yang cocok.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>

      {/* Create prescription dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Resep Baru</DialogTitle>
            <DialogDescription>Tulis resep digital untuk pasien Anda hari ini.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Pasien</label>
              <Select value={formPatient} onValueChange={setFormPatient}>
                <SelectTrigger className="h-10 rounded-xl border-[#e2e8f0] text-sm">
                  <SelectValue placeholder="Pilih pasien" />
                </SelectTrigger>
                <SelectContent>
                  {patientOptions.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Obat</label>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs font-medium text-[#3b82f6] hover:underline"
                >
                  + Tambah Obat
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {formItems.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.obat}
                        onChange={(e) => updateItem(i, 'obat', e.target.value)}
                        placeholder="Nama obat"
                        className="h-9 flex-1 rounded-lg border-slate-200 bg-white text-sm"
                      />
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          aria-label="Hapus obat"
                          onClick={() => removeItemRow(i)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={item.dosis}
                        onChange={(e) => updateItem(i, 'dosis', e.target.value)}
                        placeholder="Dosis (mis. 3x1 sehari)"
                        className="h-9 flex-1 rounded-lg border-slate-200 bg-white text-sm"
                      />
                      <Input
                        value={item.instruksi}
                        onChange={(e) => updateItem(i, 'instruksi', e.target.value)}
                        placeholder="Instruksi (mis. sesudah makan)"
                        className="h-9 flex-1 rounded-lg border-slate-200 bg-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Catatan Tambahan</label>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                rows={2}
                placeholder="Opsional"
                className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-full">
              Batal
            </Button>
            <Button onClick={handleSaveResep} className="rounded-full bg-green-600 text-white hover:bg-green-700">
              Simpan Resep
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View / print prescription dialog */}
      <Dialog open={!!viewResep} onOpenChange={(open) => !open && setViewResep(null)}>
        <DialogContent className="max-w-md">
          {viewResep && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <Pill className="size-4" />
                  </div>
                  <div>
                    <DialogTitle>Resep Digital</DialogTitle>
                    <DialogDescription>Smile+ Dental Studio</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Pasien</span>
                  <span className="font-medium text-slate-800">{viewResep.patient}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Dokter</span>
                  <span className="font-medium text-slate-800">{viewResep.doctor}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-medium text-slate-800">{viewResep.date}</span>
                </div>

                <div className="flex flex-col gap-2 border-t border-dashed border-slate-200 pt-3">
                  {viewResep.items.map((it, i) => (
                    <div key={i} className="flex flex-col gap-0.5 text-sm">
                      <span className="font-semibold text-slate-800">
                        {i + 1}. {it.obat}
                      </span>
                      <span className="pl-4 text-slate-500">{it.dosis} &middot; {it.instruksi}</span>
                    </div>
                  ))}
                </div>

                {viewResep.note && (
                  <div className="border-t border-dashed border-slate-200 pt-3 text-sm">
                    <span className="text-slate-500">Catatan: </span>
                    <span className="text-slate-700">{viewResep.note}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewResep(null)} className="rounded-full">
                  Tutup
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="rounded-full bg-green-600 text-white hover:bg-green-700"
                >
                  <Printer className="size-4" />
                  Cetak
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
