import { useState } from 'react';
import { NotebookPen, UsersRound, Users, Plus, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { StatCard, DetailHighlightToggle } from '@/components/stat-card';

// Mock data matching the Figma "Summary show & hide" component exactly
// (Show state: node 583:4311, Hide state: node 583:4583).
const DEFAULT_STICKY_NOTES = ['Lantai Licin', 'Ada Lalat', 'Toilet'];

// Per-doctor waiting list, with the patients behind each count so the
// waiting-list row can open a detail popup.
const WAITING_BY_DOCTOR = [
  {
    doctor: 'drg. SM',
    patients: [
      { name: 'Agung Wijaya Kusuma', wait: '12 menit' },
      { name: 'Rina Marlina', wait: '18 menit' },
      { name: 'Budi Santoso', wait: '25 menit' },
      { name: 'Dimas Saputra', wait: '9 menit' },
      { name: 'Yoga Pratama', wait: '15 menit' },
      { name: 'Nadia Putri', wait: '20 menit' },
      { name: 'Reza Kurniawan', wait: '30 menit' },
    ],
  },
  {
    doctor: 'drg. DS',
    patients: [
      { name: 'Herman Wijaya', wait: '10 menit' },
      { name: 'Sari Dewi', wait: '22 menit' },
      { name: 'Bagus Prasetyo', wait: '14 menit' },
    ],
  },
  {
    doctor: 'drg. AN',
    patients: [
      { name: 'Siti Rahmawati', wait: '8 menit' },
      { name: 'Andi Pratama', wait: '16 menit' },
      { name: 'Wahyu Nugroho', wait: '21 menit' },
    ],
  },
];

const STATUS_BREAKDOWN = [
  { label: 'Waiting', value: 19, dot: 'bg-orange-500' },
  { label: 'Complete', value: 1, dot: 'bg-green-500' },
  { label: 'Late', value: 2, dot: 'bg-purple-500' },
  { label: 'Cancel', value: 2, dot: 'bg-red-500' },
];

/**
 * Top-of-dashboard summary section: three stat cards (Sticky notes,
 * Waiting list, Status Patient) plus a "Show/Hide Detail Highlight"
 * toggle that expands each card in place to reveal its breakdown.
 * Matches Figma nodes 583:4311 (Show/collapsed) and 583:4583
 * (Hide/expanded), redrawn with a flatter, more minimal visual style.
 *
 * Each card is a real accordion (height animates from its collapsed row
 * to its measured content height and back), so both expanding *and*
 * collapsing animate smoothly — no swapping between differently-shaped
 * DOM trees, which is what made the previous crossfade-based version
 * look abrupt on hide.
 *
 * Sticky notes is a free-text mini notes list (add/edit/delete, kept in
 * local state). Waiting list's per-doctor row opens a popup with the
 * actual patients (name + wait time) behind that doctor's count.
 */
export default function SummaryCards() {
  const [showDetail, setShowDetail] = useState(false);
  const [notes, setNotes] = useState(DEFAULT_STICKY_NOTES);
  const [newNote, setNewNote] = useState('');
  const [activeDoctor, setActiveDoctor] = useState(null);

  function addNote() {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setNewNote('');
  }

  function updateNote(index, value) {
    setNotes((prev) => prev.map((note, i) => (i === index ? value : note)));
  }

  function removeNote(index) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  const totalWaiting = WAITING_BY_DOCTOR.reduce((sum, d) => sum + d.patients.length, 0);

  return (
    <div className="flex w-full flex-col gap-3">
      <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

      <div className="flex w-full items-start gap-4">
        {/* Sticky notes — free-text notes: type to add, click a note to
            edit in place, hover to reveal a delete button. */}
        <StatCard
          icon={<NotebookPen className="size-4" />}
          title="Sticky notes"
          count={notes.length}
          showDetail={showDetail}
        >
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {notes.map((note, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50"
              >
                <span className="size-1 shrink-0 rounded-full bg-slate-300" />
                <input
                  value={note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] text-slate-700 outline-none focus:border-slate-200 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label={`Hapus catatan ${note}`}
                  onClick={() => removeNote(index)}
                  className="shrink-0 text-slate-300 opacity-0 hover:text-slate-500 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
              <Plus className="size-3 shrink-0 text-slate-400" />
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNote();
                  }
                }}
                onBlur={addNote}
                placeholder="Tambah catatan..."
                className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
              />
            </div>
          </div>
        </StatCard>

        {/* Waiting list — each row opens a popup listing the actual
            patients (name + wait time) behind that count. */}
        <StatCard
          icon={<UsersRound className="size-4" />}
          title="Waiting list"
          count={totalWaiting}
          showDetail={showDetail}
        >
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {WAITING_BY_DOCTOR.map((item) => (
              <button
                key={item.doctor}
                type="button"
                onClick={() => setActiveDoctor(item.doctor)}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-xs transition-colors hover:border-slate-200 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-700">{item.doctor}</span>
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                  {item.patients.length} waiting
                </span>
              </button>
            ))}
          </div>
        </StatCard>

        {/* Status patient breakdown */}
        <StatCard
          icon={<Users className="size-4" />}
          title="Status Patient"
          count={30}
          showDetail={showDetail}
        >
          <div className="grid flex-1 grid-cols-4 gap-2">
            {STATUS_BREAKDOWN.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2"
              >
                <p className="text-xl font-semibold text-slate-800">{item.value}</p>
                <div className="flex items-center gap-1">
                  <span className={cn('size-1.5 rounded-full', item.dot)} />
                  <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      </div>

      {/* Waiting list detail popup */}
      <Dialog open={!!activeDoctor} onOpenChange={(open) => !open && setActiveDoctor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Waiting List — {activeDoctor}</DialogTitle>
            <DialogDescription>
              Daftar pasien yang sedang menunggu untuk dokter ini.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pasien</TableHead>
                <TableHead className="text-right">Waktu Tunggu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(WAITING_BY_DOCTOR.find((d) => d.doctor === activeDoctor)?.patients ?? []).map(
                (p) => (
                  <TableRow key={p.name}>
                    <TableCell className="text-[#020617]">{p.name}</TableCell>
                    <TableCell className="text-right text-[#334155]">{p.wait}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
