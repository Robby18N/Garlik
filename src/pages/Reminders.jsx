import { useMemo, useState } from 'react';
import { Moon, Bell, BellRing, Send, XCircle, CheckCheck, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';

// Reminder templates staff can toggle on/off and edit in place — matches
// the Reminders menu's scope (H-1 / H-0 / follow-up templates, scheduled
// send via WhatsApp/SMS/email, delivery log, manual resend).
const TEMPLATES_INITIAL = [
  {
    id: 'h1',
    label: 'H-1 Reminder',
    channel: 'WhatsApp',
    active: true,
    message:
      'Halo {nama}, jangan lupa jadwal kunjungan Anda besok pukul {jam} bersama {dokter} di Smile+ Dental Studio. Sampai jumpa!',
  },
  {
    id: 'h0',
    label: 'H-0 Reminder',
    channel: 'WhatsApp',
    active: true,
    message:
      'Halo {nama}, ini pengingat jadwal kunjungan Anda HARI INI pukul {jam} bersama {dokter}. Mohon datang 10 menit lebih awal ya!',
  },
  {
    id: 'followup',
    label: 'Follow-up Pasca Tindakan',
    channel: 'SMS',
    active: false,
    message:
      'Halo {nama}, bagaimana kondisi Anda setelah tindakan {tindakan}? Jangan ragu hubungi kami jika ada keluhan.',
  },
];

const LOG_INITIAL = [
  { id: 1, patientName: 'Agung Wijaya Kusuma', type: 'H-1 Reminder', channel: 'WhatsApp', time: '07:00', status: 'Dibaca' },
  { id: 2, patientName: 'Siti Rahmawati', type: 'H-1 Reminder', channel: 'WhatsApp', time: '07:00', status: 'Terkirim' },
  { id: 3, patientName: 'Budi Santoso', type: 'H-0 Reminder', channel: 'WhatsApp', time: '07:30', status: 'Gagal' },
  { id: 4, patientName: 'Dewi Lestari', type: 'H-0 Reminder', channel: 'WhatsApp', time: '07:30', status: 'Dibaca' },
  { id: 5, patientName: 'Andi Pratama', type: 'Follow-up Pasca Tindakan', channel: 'SMS', time: '12:00', status: 'Terkirim' },
  { id: 6, patientName: 'Rina Marlina', type: 'H-1 Reminder', channel: 'WhatsApp', time: '07:00', status: 'Gagal' },
  { id: 7, patientName: 'Fajar Hidayat', type: 'H-0 Reminder', channel: 'WhatsApp', time: '07:30', status: 'Terkirim' },
];

const STATUS_STYLES = {
  Terkirim: 'border-transparent bg-[rgba(59,130,246,0.08)] text-[#3b82f6]',
  Dibaca: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Gagal: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
};

const HEADER_CLASS = 'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Reminders() {
  const [templates, setTemplates] = useState(TEMPLATES_INITIAL);
  const [log, setLog] = useState(LOG_INITIAL);
  const [showDetail, setShowDetail] = useState(false);

  function updateTemplateMessage(id, message) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, message } : t)));
  }

  function toggleTemplateActive(id, active) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
    toast.success(`${active ? 'Mengaktifkan' : 'Menonaktifkan'} template pengingat`);
  }

  function handleResend(entryId) {
    setLog((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, status: 'Terkirim', time: nowTimeLabel() } : entry
      )
    );
    const entry = log.find((e) => e.id === entryId);
    toast.success(`Pengingat berhasil dikirim ulang ke ${entry?.patientName ?? 'pasien'}`);
  }

  const stats = useMemo(() => {
    const total = log.length;
    const typeBreakdown = ['H-1 Reminder', 'H-0 Reminder', 'Follow-up Pasca Tindakan'].map((type) => ({
      type,
      value: log.filter((e) => e.type === type).length,
    }));
    const sentList = log.filter((e) => e.status !== 'Gagal');
    const failedList = log.filter((e) => e.status === 'Gagal');
    const readCount = log.filter((e) => e.status === 'Dibaca').length;
    const readRate = sentList.length ? Math.round((readCount / sentList.length) * 100) : 0;
    return { total, typeBreakdown, sentList, failedList, readCount, readRate };
  }, [log]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f5f6f8] lg:flex-row">
      <AppSidebar activeKey="reminders" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Reminders</h1>
            <span className="truncate text-sm text-slate-500">Template &amp; Log Pengingat Pasien</span>
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
          {/* Overview stat row — same expandable StatCard format used across
              Today's Patient, Records, Activity, and Billing. */}
          <div className="flex w-full flex-col gap-3">
            <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

            <div className="flex w-full flex-wrap items-start gap-4">
              <StatCard
                icon={<BellRing className="size-4" />}
                title="Total Pengingat Hari Ini"
                count={stats.total}
                showDetail={showDetail}
              >
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.typeBreakdown.map((item) => (
                    <div key={item.type} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="truncate font-medium text-slate-700">{item.type}</span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<Send className="size-4" />}
                title="Terkirim"
                count={stats.sentList.length}
                showDetail={showDetail}
              >
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.sentList.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="truncate font-medium text-slate-700">{e.patientName}</span>
                      <span className="shrink-0 text-slate-400">{e.time}</span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<XCircle className="size-4" />}
                title="Gagal Kirim"
                count={stats.failedList.length}
                showDetail={showDetail}
              >
                {stats.failedList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada pengiriman yang gagal.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.failedList.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{e.patientName}</span>
                        <button
                          type="button"
                          onClick={() => handleResend(e.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                        >
                          <RotateCw className="size-3" />
                          Kirim Ulang
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<CheckCheck className="size-4" />}
                title="Tingkat Dibaca"
                count={`${stats.readRate}%`}
                showDetail={showDetail}
              >
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2">
                    <p className="text-xl font-semibold text-slate-800">{stats.readCount}</p>
                    <span className="text-[11px] font-medium text-slate-500">Dibaca</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2">
                    <p className="text-xl font-semibold text-slate-800">{stats.sentList.length - stats.readCount}</p>
                    <span className="text-[11px] font-medium text-slate-500">Terkirim Saja</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2">
                    <p className="text-xl font-semibold text-slate-800">{stats.failedList.length}</p>
                    <span className="text-[11px] font-medium text-slate-500">Gagal</span>
                  </div>
                </div>
              </StatCard>
            </div>
          </div>

          {/* Reminder templates — editable message + active toggle per type */}
          <div className="flex w-full flex-wrap items-stretch gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="min-w-[260px] flex flex-1 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-semibold text-slate-900">{template.label}</p>
                    <Badge variant="outline" className="mt-1 w-fit rounded-full border-slate-200 text-[11px] font-medium text-slate-500">
                      {template.channel}
                    </Badge>
                  </div>
                  <Switch
                    checked={template.active}
                    onCheckedChange={(checked) => toggleTemplateActive(template.id, checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <textarea
                  value={template.message}
                  onChange={(e) => updateTemplateMessage(template.id, e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-[13px] text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                />
                <p className="text-[11px] text-slate-400">
                  Variabel: {'{nama}'}, {'{jam}'}, {'{dokter}'}, {'{tindakan}'}
                </p>
              </div>
            ))}
          </div>

          {/* Delivery log */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-base font-semibold text-slate-950">Log Pengiriman</p>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table className="table-fixed min-w-[820px]">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, 'w-[4%]', 'text-left')}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[24%]', 'text-left')}>Pasien</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[22%]', 'text-left')}>Jenis Pengingat</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[14%]', 'text-left')}>Channel</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[12%]', 'text-left')}>Waktu</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[12%]', 'text-left')}>Status</TableHead>
                    <TableHead className={cn(HEADER_CLASS, 'w-[12%]', 'text-left')}>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}
                    >
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{entry.patientName}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{entry.type}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{entry.channel}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{entry.time}</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[entry.status])}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        {entry.status === 'Gagal' ? (
                          <button
                            type="button"
                            onClick={() => handleResend(entry.id)}
                            aria-label={`Kirim ulang pengingat untuk ${entry.patientName}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            <RotateCw className="size-3" />
                            Kirim Ulang
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
