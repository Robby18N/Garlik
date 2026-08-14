import { useMemo, useState } from 'react';
import { Moon, Bell, Search, Pill, AlertTriangle, Stethoscope, BookOpen, Printer, ChevronDown } from 'lucide-react';

import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Reference-only content for the Database menu — a quick lookup a doctor
// opens mid-consultation, distinct from Records (per-patient transactional
// history). None of this is patient-specific or editable; it's the shared
// clinic knowledge base every doctor consults the same copy of.
const FORMULARY = [
  { obat: 'Asam Mefenamat 500mg', kategori: 'Analgesik', dosis: '3x1 sehari, sesudah makan', catatan: 'Hindari pada gangguan lambung berat' },
  { obat: 'Amoxicillin 500mg', kategori: 'Antibiotik', dosis: '3x1 sehari selama 5-7 hari', catatan: 'Cek riwayat alergi penisilin dahulu' },
  { obat: 'Ibuprofen 400mg', kategori: 'Analgesik', dosis: '3x1 sehari, sesudah makan', catatan: 'Hindari pada asma & tukak lambung' },
  { obat: 'Clindamycin 300mg', kategori: 'Antibiotik', dosis: '3x1 sehari selama 5 hari', catatan: 'Alternatif bila alergi penisilin' },
  { obat: 'Obat Kumur Antiseptik (Chlorhexidine 0.2%)', kategori: 'Antiseptik', dosis: '2x sehari, kumur 30 detik', catatan: 'Tidak untuk ditelan' },
  { obat: 'Fluoride Topikal Gel', kategori: 'Preventif', dosis: '1x aplikasi di klinik', catatan: 'Untuk gigi sensitif / risiko karies tinggi' },
  { obat: 'Paracetamol 500mg', kategori: 'Analgesik', dosis: '3-4x1 sehari', catatan: 'Aman untuk ibu hamil & anak-anak' },
  { obat: 'Metronidazole 500mg', kategori: 'Antibiotik', dosis: '3x1 sehari selama 5 hari', catatan: 'Dikombinasikan untuk infeksi anaerob' },
];

const FORMULARY_CATEGORY_STYLES = {
  Analgesik: 'border-transparent bg-[rgba(59,130,246,0.08)] text-[#3b82f6]',
  Antibiotik: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  Antiseptik: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Preventif: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
};

const ALLERGY_INTERACTIONS = [
  { alergen: 'Penisilin (mis. Amoxicillin)', hindari: 'Semua golongan Penisilin & turunannya', alternatif: 'Clindamycin, Azithromycin' },
  { alergen: 'Sulfa', hindari: 'Obat golongan Sulfonamida', alternatif: 'Amoxicillin (bila tidak ada riwayat alergi penisilin)' },
  { alergen: 'Ibuprofen / NSAID', hindari: 'Ibuprofen, Asam Mefenamat, Diclofenac', alternatif: 'Paracetamol' },
  { alergen: 'Codein', hindari: 'Codein & opioid ringan lain', alternatif: 'Paracetamol atau Asam Mefenamat' },
  { alergen: 'Lateks', hindari: 'Sarung tangan & rubber dam berbahan lateks', alternatif: 'Gunakan sarung tangan nitrile' },
];

const CLINICAL_REFERENCE = [
  { diagnosis: 'Karies Email', tindakan: 'Tambal Gigi (Komposit)', durasi: '45 Min' },
  { diagnosis: 'Karies Dentin', tindakan: 'Tambal Gigi (Komposit/GIC)', durasi: '45-60 Min' },
  { diagnosis: 'Pulpitis Reversibel', tindakan: 'Konsultasi + Analgesik', durasi: '30 Min' },
  { diagnosis: 'Pulpitis Ireversibel', tindakan: 'Perawatan Saluran Akar (rujuk bila perlu)', durasi: '90 Min' },
  { diagnosis: 'Karang Gigi (Kalkulus)', tindakan: 'Scaling', durasi: '45 Min' },
  { diagnosis: 'Gigi Bungsu Impaksi', tindakan: 'Cabut Gigi (bedah minor)', durasi: '60-90 Min' },
  { diagnosis: 'Resesi Gingiva Ringan', tindakan: 'Evaluasi + Pasta Gigi Sensitif', durasi: '30 Min' },
  { diagnosis: 'Diskolorasi Ekstrinsik', tindakan: 'Whitening', durasi: '90 Min' },
];

const PATIENT_EDUCATION = [
  {
    title: 'Pasca Cabut Gigi',
    points: [
      'Gigit kasa selama 30-45 menit, ganti bila masih berdarah.',
      'Hindari berkumur kuat atau menyedot (merokok/sedotan) selama 24 jam.',
      'Kompres dingin di pipi luar bila bengkak pada hari pertama.',
      'Makan makanan lunak dan hindari sisi bekas pencabutan selama 2-3 hari.',
      'Minum obat sesuai resep; kembali bila nyeri/bengkak bertambah setelah 3 hari.',
    ],
  },
  {
    title: 'Pasca Scaling',
    points: [
      'Gigi dan gusi bisa terasa ngilu 1-2 hari, ini normal.',
      'Gunakan obat kumur antiseptik 2x sehari selama 3 hari.',
      'Hindari makanan/minuman panas, dingin, atau asam berlebih sementara.',
      'Sikat gigi tetap dilakukan seperti biasa dengan lembut.',
    ],
  },
  {
    title: 'Pasca Tambal Gigi',
    points: [
      'Tunggu ± 1 jam sebelum makan bila menggunakan bahan tertentu (khusus GIC).',
      'Hindari mengunyah di sisi gigi yang ditambal selama beberapa jam pertama.',
      'Gigi bisa sedikit sensitif terhadap dingin selama beberapa hari.',
      'Kontrol kembali bila tambalan terasa mengganjal atau lepas.',
    ],
  },
  {
    title: 'Perawatan Kawat Gigi (Behel)',
    points: [
      'Hindari makanan keras dan lengket (permen karet, es batu, kacang keras).',
      'Sikat gigi setelah makan, gunakan sikat khusus ortodonti bila perlu.',
      'Gunakan wax ortodonti bila kawat melukai bagian dalam mulut.',
      'Kontrol rutin sesuai jadwal untuk penyesuaian kawat.',
    ],
  },
];

const TABS = [
  { key: 'formulary', label: 'Formularium Obat', icon: Pill },
  { key: 'allergy', label: 'Alergi & Interaksi', icon: AlertTriangle },
  { key: 'clinical', label: 'Diagnosis & Tindakan', icon: Stethoscope },
  { key: 'education', label: 'Materi Edukasi', icon: BookOpen },
];

const HEADER_CLASS = 'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

function FormularyTab() {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return FORMULARY;
    return FORMULARY.filter(
      (f) => f.obat.toLowerCase().includes(trimmed) || f.kategori.toLowerCase().includes(trimmed)
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-[280px] max-w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama obat atau kategori"
          className="h-10 rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-10 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        />
      </div>
      <div className="overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-transparent hover:bg-transparent">
              <TableHead className={cn(HEADER_CLASS, 'w-[26%] text-left')}>Nama Obat</TableHead>
              <TableHead className={cn(HEADER_CLASS, 'w-[14%] text-left')}>Kategori</TableHead>
              <TableHead className={cn(HEADER_CLASS, 'w-[26%] text-left')}>Dosis Standar</TableHead>
              <TableHead className={cn(HEADER_CLASS, 'w-[34%] text-left')}>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item, i) => (
              <TableRow key={item.obat} className={cn('border-b border-[#e2e8f0]', i % 2 === 1 && 'bg-[#f8fafc]')}>
                <TableCell className="!align-middle whitespace-normal py-3 text-left font-medium text-[#334155]">{item.obat}</TableCell>
                <TableCell className="!align-middle py-3 text-left">
                  <Badge className={cn('rounded-full px-2 py-0.5 text-[11px]', FORMULARY_CATEGORY_STYLES[item.kategori])}>
                    {item.kategori}
                  </Badge>
                </TableCell>
                <TableCell className="!align-middle whitespace-normal py-3 text-left text-[#334155]">{item.dosis}</TableCell>
                <TableCell className="!align-middle whitespace-normal py-3 text-left text-[#64748b]">{item.catatan}</TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-16 text-left text-[#64748b]">
                  Tidak ada obat yang cocok dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AllergyTab() {
  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-transparent hover:bg-transparent">
            <TableHead className={cn(HEADER_CLASS, 'w-[25%] text-left')}>Alergen</TableHead>
            <TableHead className={cn(HEADER_CLASS, 'w-[37%] text-left')}>Hindari</TableHead>
            <TableHead className={cn(HEADER_CLASS, 'w-[38%] text-left')}>Alternatif Aman</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALLERGY_INTERACTIONS.map((item, i) => (
            <TableRow key={item.alergen} className={cn('border-b border-[#e2e8f0]', i % 2 === 1 && 'bg-[#f8fafc]')}>
              <TableCell className="!align-middle whitespace-normal py-3 text-left">
                <span className="inline-flex items-start gap-1.5 font-medium text-[#ba1a1a]">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {item.alergen}
                </span>
              </TableCell>
              <TableCell className="!align-middle whitespace-normal py-3 text-left text-[#334155]">{item.hindari}</TableCell>
              <TableCell className="!align-middle whitespace-normal py-3 text-left text-[#16a34a]">{item.alternatif}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ClinicalReferenceTab() {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return CLINICAL_REFERENCE;
    return CLINICAL_REFERENCE.filter(
      (c) => c.diagnosis.toLowerCase().includes(trimmed) || c.tindakan.toLowerCase().includes(trimmed)
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-[280px] max-w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari diagnosis atau tindakan"
          className="h-10 rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-10 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        />
      </div>
      <div className="overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-transparent hover:bg-transparent">
              <TableHead className={cn(HEADER_CLASS, 'w-[35%] text-left')}>Diagnosis</TableHead>
              <TableHead className={cn(HEADER_CLASS, 'w-[45%] text-left')}>Tindakan Standar</TableHead>
              <TableHead className={cn(HEADER_CLASS, 'w-[20%] text-left')}>Estimasi Durasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item, i) => (
              <TableRow key={item.diagnosis} className={cn('border-b border-[#e2e8f0]', i % 2 === 1 && 'bg-[#f8fafc]')}>
                <TableCell className="!align-middle whitespace-normal py-3 text-left font-medium text-[#334155]">{item.diagnosis}</TableCell>
                <TableCell className="!align-middle whitespace-normal py-3 text-left text-[#334155]">{item.tindakan}</TableCell>
                <TableCell className="!align-middle py-3 text-left text-[#64748b]">{item.durasi}</TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-left text-[#64748b]">
                  Tidak ada data yang cocok dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EducationTab() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {PATIENT_EDUCATION.map((topic, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={topic.title} className="rounded-2xl border border-slate-100 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
            >
              <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-900">
                <BookOpen className="size-4 text-slate-400" />
                {topic.title}
              </span>
              <ChevronDown className={cn('size-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="flex flex-col gap-2 border-t border-slate-50 px-5 py-4">
                <ul className="flex flex-col gap-2">
                  {topic.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-300" />
                      {point}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Printer className="size-3.5" />
                  Cetak untuk Pasien
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Database() {
  const [activeTab, setActiveTab] = useState('formulary');

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="database" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Database</h1>
            <span className="text-sm text-slate-500">Referensi Klinis</span>
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
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
            <div className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-colors',
                    activeTab === key ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              {activeTab === 'formulary' && <FormularyTab />}
              {activeTab === 'allergy' && <AllergyTab />}
              {activeTab === 'clinical' && <ClinicalReferenceTab />}
              {activeTab === 'education' && <EducationTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
