import { useState } from 'react';
import { ChevronDown, NotebookPen, UsersRound, Users, Plus, X } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

// Mock data matching the Figma "Summary show & hide" component exactly
// (Show state: node 583:4311, Hide state: node 583:4583).
const DEFAULT_STICKY_NOTES = ['Lantai Licin', 'Ada Lalat', 'Toilet'];

// Per-doctor waiting list, with the patients behind each count so the
// "N Patient Waiting list" pill can open a detail popup.
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
  { label: 'Waiting', value: 19, color: 'orange' },
  { label: 'Complete', value: 1, color: 'green' },
  { label: 'Late', value: 2, color: 'purple' },
  { label: 'Cancel', value: 2, color: 'red' },
];

const STATUS_BADGE_CLASS = {
  orange: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  green: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#22c55e]',
  purple: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  red: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
};

/**
 * Top-of-dashboard summary section: three stat cards (Sticky notes,
 * Waiting list, Status Patient) plus a "Show/Hide Detail Highlight"
 * toggle that expands a second row with the breakdown for each card.
 * Matches Figma nodes 583:4311 (Show/collapsed) and 583:4583
 * (Hide/expanded). Manages its own expand/collapse state — no props
 * required.
 *
 * Sticky notes is a free-text mini notes list (add/edit/delete, kept in
 * local state). Waiting list's per-doctor pill opens a popup with the
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
      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-2 self-end text-sm font-medium text-[#3b82f6] hover:underline"
      >
        {showDetail ? 'Hide Detail Highlight' : 'Show Detail Highlight'}
        <ChevronDown className={cn('size-6 transition-transform', showDetail && 'rotate-180')} />
      </button>

      {!showDetail && (
        <div className="flex w-full items-center justify-center gap-4">
          <Card className="h-[42px] w-[438px] shrink-0 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <NotebookPen className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Sticky notes <span className="text-[#16a34a]">({notes.length})</span>
            </p>
          </Card>
          <Card className="h-[42px] flex-1 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <UsersRound className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Waiting list <span className="text-[#16a34a]">({totalWaiting})</span>
            </p>
          </Card>
          <Card className="h-[42px] flex-1 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Users className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Status Patient <span className="text-[#15803d]">(30)</span>
            </p>
          </Card>
        </div>
      )}

      {showDetail && (
        <div className="flex w-full items-stretch gap-4">
          {/* Sticky notes detail — free-text notes: type to add, click a
              note to edit in place, hover to reveal a delete button. */}
          <Card className="h-[144px] flex-1 gap-2 overflow-y-auto rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <NotebookPen className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Sticky notes</p>
            </div>
            <div className="flex flex-col gap-1">
              {notes.map((note, index) => (
                <div key={index} className="group flex items-center gap-1.5">
                  <span className="text-[#020617]">•</span>
                  <input
                    value={note}
                    onChange={(e) => updateNote(index, e.target.value)}
                    className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] tracking-wide text-[#020617] outline-none hover:border-slate-200 focus:border-slate-300 focus:bg-white"
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
              <div className="flex items-center gap-1.5">
                <Plus className="size-3.5 shrink-0 text-slate-400" />
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
                  className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] tracking-wide text-[#020617] outline-none placeholder:text-slate-400 hover:border-slate-200 focus:border-slate-300 focus:bg-white"
                />
              </div>
            </div>
          </Card>

          {/* Waiting list detail — each pill opens a popup listing the
              actual patients (name + wait time) behind that count. */}
          <Card className="h-[144px] flex-1 gap-2 overflow-y-auto rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <UsersRound className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Waiting list</p>
            </div>
            <div className="flex flex-col gap-2">
              {WAITING_BY_DOCTOR.map((item) => (
                <button
                  key={item.doctor}
                  type="button"
                  onClick={() => setActiveDoctor(item.doctor)}
                  className="flex items-center justify-between gap-[3px] rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-amber-50 px-3 py-2 text-xs hover:border-slate-300"
                >
                  <p className="text-[#020617]">{item.doctor}</p>
                  <p className="font-semibold text-black">
                    {item.patients.length} Patient Waiting list
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Status patient detail */}
          <Card className="h-[144px] flex-1 justify-between gap-4 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Users className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Status Patient</p>
            </div>
            <div className="flex items-start">
              {STATUS_BREAKDOWN.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-slate-200 px-2 first:border-l"
                >
                  <p className="text-2xl font-semibold tracking-tight text-[#171717]">{item.value}</p>
                  <Badge className={cn('rounded-full px-2.5 py-0.5', STATUS_BADGE_CLASS[item.color])}>
                    {item.label}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
