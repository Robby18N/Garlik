import { useMemo, useState } from 'react';
import { Moon, Bell, Search, X, Eye, Receipt, CheckCircle2, AlertCircle, Wallet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePatientStatus } from '@/context/patient-status-context';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import BillingDetailSheet, { formatRupiah } from '@/components/billing-detail-sheet';
import { cn } from '@/lib/utils';

// Today's invoices — generated from treatments already logged by the
// doctor (per the Billing menu's scope: invoicing from doctor-entered
// treatments, payment recording across methods, receipts, outstanding
// balance tracking, and a daily transaction log).
const BILLING_INVOICES_INITIAL = [
  { id: 1, invoiceNo: 'INV-20260814-001', patientName: 'Agung Wijaya Kusuma', mrn: 'P-0001', doctor: 'drg. SM', date: '14 Aug 2026 08:40', items: [{ name: 'Scaling', price: 350000 }], method: 'Cash', status: 'Paid', paidAmount: 350000 },
  { id: 2, invoiceNo: 'INV-20260814-002', patientName: 'Siti Rahmawati', mrn: 'P-0002', doctor: 'drg. AN', date: '14 Aug 2026 09:05', items: [{ name: 'Tambal Gigi', price: 250000 }], method: 'Transfer', status: 'Paid', paidAmount: 250000 },
  { id: 3, invoiceNo: 'INV-20260814-003', patientName: 'Budi Santoso', mrn: 'P-0003', doctor: 'drg. SM', date: '14 Aug 2026 09:20', items: [{ name: 'Scaling', price: 350000 }], method: null, status: 'Unpaid', paidAmount: 0 },
  { id: 4, invoiceNo: 'INV-20260814-004', patientName: 'Dewi Lestari', mrn: 'P-0004', doctor: 'drg. RF', date: '14 Aug 2026 09:35', items: [{ name: 'Konsultasi', price: 100000 }, { name: 'Obat Pereda Nyeri', price: 45000 }], method: 'Transfer', status: 'Paid', paidAmount: 145000 },
  { id: 5, invoiceNo: 'INV-20260814-005', patientName: 'Andi Pratama', mrn: 'P-0005', doctor: 'drg. AN', date: '14 Aug 2026 09:55', items: [{ name: 'Tambal Gigi', price: 250000 }], method: 'Cash', status: 'Partial', paidAmount: 100000 },
  { id: 6, invoiceNo: 'INV-20260814-006', patientName: 'Rina Marlina', mrn: 'P-0006', doctor: 'drg. SM', date: '14 Aug 2026 10:10', items: [{ name: 'Perawatan Gigi Sensitif', price: 150000 }], method: 'Kartu', status: 'Paid', paidAmount: 150000 },
  { id: 7, invoiceNo: 'INV-20260814-007', patientName: 'Fajar Hidayat', mrn: 'P-0007', doctor: 'drg. RF', date: '14 Aug 2026 10:25', items: [{ name: 'Cabut Gigi', price: 300000 }, { name: 'Obat Antibiotik', price: 60000 }], method: null, status: 'Unpaid', paidAmount: 0 },
  { id: 8, invoiceNo: 'INV-20260814-008', patientName: 'Nur Aisyah', mrn: 'P-0008', doctor: 'drg. AN', date: '14 Aug 2026 10:40', items: [{ name: 'Pembersihan Karang Gigi', price: 300000 }], method: 'Kartu', status: 'Paid', paidAmount: 300000 },
  { id: 9, invoiceNo: 'INV-20260814-009', patientName: 'Dimas Saputra', mrn: 'P-0009', doctor: 'drg. SM', date: '14 Aug 2026 10:55', items: [{ name: 'Tambal Gigi', price: 250000 }], method: 'Cash', status: 'Partial', paidAmount: 150000 },
  { id: 10, invoiceNo: 'INV-20260814-010', patientName: 'Maya Sari', mrn: 'P-0010', doctor: 'drg. RF', date: '14 Aug 2026 11:10', items: [{ name: 'Konsultasi', price: 100000 }], method: 'Transfer', status: 'Paid', paidAmount: 100000 },
  { id: 11, invoiceNo: 'INV-20260814-011', patientName: 'Rizky Ramadhan', mrn: 'P-0011', doctor: 'drg. AN', date: '14 Aug 2026 11:25', items: [{ name: 'Perawatan Gusi', price: 200000 }], method: null, status: 'Unpaid', paidAmount: 0 },
  { id: 12, invoiceNo: 'INV-20260814-012', patientName: 'Putri Amelia', mrn: 'P-0011', doctor: 'drg. SM', date: '14 Aug 2026 11:40', items: [{ name: 'Whitening', price: 1500000 }], method: 'Kartu', status: 'Paid', paidAmount: 1500000 },
  { id: 13, invoiceNo: 'INV-20260814-013', patientName: 'Arif Setiawan', mrn: 'P-0012', doctor: 'drg. RF', date: '14 Aug 2026 11:55', items: [{ name: 'Perawatan Gigi Patah', price: 400000 }], method: 'Cash', status: 'Paid', paidAmount: 400000 },
  { id: 14, invoiceNo: 'INV-20260814-014', patientName: 'Lina Wulandari', mrn: 'P-0013', doctor: 'drg. AN', date: '14 Aug 2026 12:10', items: [{ name: 'Scaling', price: 350000 }], method: null, status: 'Unpaid', paidAmount: 0 },
];

const STATUS_FILTERS = ['Semua', 'Paid', 'Unpaid', 'Partial'];
const STATUS_STYLES = {
  Paid: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Unpaid: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  Partial: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

const COL_WIDTH = {
  no: 'w-[3%]',
  invoice: 'w-[13%]',
  patient: 'w-[16%]',
  treatment: 'w-[17%]',
  doctor: 'w-[8%]',
  method: 'w-[9%]',
  amount: 'w-[11%]',
  status: 'w-[9%]',
  action: 'w-[6%]',
};

const HEADER_CLASS = 'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

// Invoice `mrn` values are the same "P-0001"-style patient id used across
// Today's Patient (search, remark threads, etc) — parsing the number back
// out is how an invoice here gets matched up to that patient's live
// clinical status.
function patientIdFromMrn(mrn) {
  const num = parseInt(String(mrn ?? '').replace('P-', ''), 10);
  return Number.isNaN(num) ? null : num;
}

export default function Billing() {
  // Live per-patient clinical status, shared with Today's Patient — used
  // here purely to detect "just marked Complete by the doctor, still
  // unpaid" invoices so they can be surfaced at the top of the list.
  const { statusOverrides, completedOrder } = usePatientStatus();

  const [invoices, setInvoices] = useState(BILLING_INVOICES_INITIAL);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  function handleView(invoice) {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  }

  function handleRecordPayment(invoiceId, method, amount) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        // `inv` here is the raw state record (items + paidAmount only) — it
        // doesn't carry `total`, that's derived separately in
        // `invoicesWithTotal` below. Recompute it here too, otherwise the
        // merged object handed to setSelectedInvoice ends up with
        // `total: undefined` and the sheet renders "Rp NaN".
        const total = inv.items.reduce((sum, item) => sum + item.price, 0);
        const nextPaid = inv.paidAmount + amount;
        const status = nextPaid >= total ? 'Paid' : 'Partial';
        const updated = { ...inv, paidAmount: nextPaid, method, status };
        setSelectedInvoice({ ...updated, total });
        return updated;
      })
    );
    toast.success('Pembayaran berhasil dicatat');
  }

  const invoicesWithTotal = useMemo(
    () =>
      invoices.map((inv) => {
        const patientId = patientIdFromMrn(inv.mrn);
        // "Baru selesai & belum bayar" — the doctor just marked this
        // patient's treatment Complete on Today's Patient and there's
        // still nothing paid on their invoice, so front desk needs to see
        // it first to go collect payment.
        const justCompleted =
          patientId != null && statusOverrides[patientId] === 'Complete' && inv.status === 'Unpaid';
        return {
          ...inv,
          total: inv.items.reduce((sum, item) => sum + item.price, 0),
          justCompleted,
          completedRank: patientId != null ? (completedOrder[patientId] ?? 0) : 0,
        };
      }),
    [invoices, statusOverrides, completedOrder]
  );

  // Newest "just completed & unpaid" invoices float to the very top (most
  // recent completion first); everything else keeps its original relative
  // order — Array.prototype.sort is stable, so returning 0 below preserves
  // it rather than reshuffling the rest of the list.
  const sortedInvoices = useMemo(
    () =>
      [...invoicesWithTotal].sort((a, b) => {
        if (a.justCompleted && !b.justCompleted) return -1;
        if (!a.justCompleted && b.justCompleted) return 1;
        if (a.justCompleted && b.justCompleted) return b.completedRank - a.completedRank;
        return 0;
      }),
    [invoicesWithTotal]
  );

  const visibleInvoices = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return sortedInvoices.filter((inv) => {
      const matchesQuery =
        !trimmed ||
        inv.patientName.toLowerCase().includes(trimmed) ||
        inv.invoiceNo.toLowerCase().includes(trimmed);
      const matchesStatus = statusFilter === 'Semua' || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [sortedInvoices, query, statusFilter]);

  const stats = useMemo(() => {
    const total = invoicesWithTotal.length;
    const statusBreakdown = ['Paid', 'Unpaid', 'Partial'].map((status) => ({
      status,
      value: invoicesWithTotal.filter((inv) => inv.status === status).length,
    }));
    const paidList = invoicesWithTotal.filter((inv) => inv.status === 'Paid');
    const outstandingList = invoicesWithTotal
      .filter((inv) => inv.status !== 'Paid')
      .map((inv) => ({ ...inv, outstanding: inv.total - inv.paidAmount }));
    const revenueToday = invoicesWithTotal.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const revenueByMethod = ['Cash', 'Transfer', 'Kartu'].map((method) => ({
      method,
      value: invoicesWithTotal
        .filter((inv) => inv.method === method)
        .reduce((sum, inv) => sum + inv.paidAmount, 0),
    })).filter((m) => m.value > 0);
    return {
      total,
      statusBreakdown,
      paidCount: paidList.length,
      paidList,
      outstandingList,
      revenueToday,
      revenueByMethod,
    };
  }, [invoicesWithTotal]);

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <AppSidebar activeKey="billing" width={60} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Billing</h1>
            <span className="text-sm text-slate-500">Transaksi &amp; Pembayaran Hari Ini</span>
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
          {/* Overview stat row — same expandable StatCard format used across
              Today's Patient, Records, and Activity. */}
          <div className="flex w-full flex-col gap-3">
            <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

            <div className="flex w-full items-start gap-4">
              <StatCard
                icon={<Receipt className="size-4" />}
                title="Total Tagihan Hari Ini"
                count={stats.total}
                showDetail={showDetail}
              >
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {stats.statusBreakdown.map((item) => (
                    <div
                      key={item.status}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2"
                    >
                      <p className="text-xl font-semibold text-slate-800">{item.value}</p>
                      <span className="text-[11px] font-medium text-slate-500">{item.status}</span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<CheckCircle2 className="size-4" />}
                title="Sudah Dibayar"
                count={stats.paidCount}
                showDetail={showDetail}
              >
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.paidList.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="truncate font-medium text-slate-700">{inv.patientName}</span>
                      <span className="shrink-0 text-slate-500">{formatRupiah(inv.paidAmount)}</span>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard
                icon={<AlertCircle className="size-4" />}
                title="Menunggu Pembayaran"
                count={stats.outstandingList.length}
                showDetail={showDetail}
              >
                {stats.outstandingList.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Semua tagihan sudah lunas.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {stats.outstandingList.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                        <span className="truncate font-medium text-slate-700">{inv.patientName}</span>
                        <span className="shrink-0 font-medium text-[#ef4444]">{formatRupiah(inv.outstanding)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              <StatCard
                icon={<Wallet className="size-4" />}
                title="Pendapatan Hari Ini"
                count={formatRupiah(stats.revenueToday)}
                showDetail={showDetail}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Berdasarkan Metode
                </p>
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {stats.revenueByMethod.map((m) => (
                    <div key={m.method} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px]">
                      <span className="font-medium text-slate-700">{m.method}</span>
                      <span className="shrink-0 text-slate-500">{formatRupiah(m.value)}</span>
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
                Showing {visibleInvoices.length} of {invoicesWithTotal.length} entries
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-[280px] max-w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama pasien atau No. Invoice"
                    aria-label="Cari invoice berdasarkan nama pasien atau nomor invoice"
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 rounded-3xl border-[#e2e8f0] px-4 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'Semua' ? 'Semua Status' : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invoice table */}
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.no, 'text-left')}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.invoice, 'text-left')}>No. Invoice</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.patient, 'text-left')}>Pasien</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.treatment, 'text-left')}>Tindakan</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.doctor, 'text-left')}>Dokter</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.method, 'text-left')}>Metode</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.amount, 'text-left')}>Jumlah</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.status, 'text-left')}>Status</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.action, 'text-left')}>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.map((inv, index) => (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        'border-b border-[#e2e8f0]',
                        index % 2 === 1 && 'bg-[#f8fafc]',
                        // Just-completed-and-unpaid rows get a subtle green
                        // left rail so they read as newly surfaced, not
                        // just "happens to be first".
                        inv.justCompleted && 'border-l-2 border-l-[#16a34a] bg-[rgba(34,197,94,0.04)]'
                      )}
                    >
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{inv.invoiceNo}</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <div className="flex items-center gap-2">
                          <PatientNameHoverCard name={inv.patientName} category="Regular" />
                          {inv.justCompleted && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(34,197,94,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                              <Sparkles className="size-3" />
                              Baru Selesai
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">
                        {inv.items.map((item) => item.name).join(', ')}
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{inv.doctor}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{inv.method ?? '-'}</TableCell>
                      <TableCell className="!align-middle py-3 text-left text-[#334155]">{formatRupiah(inv.total)}</TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[inv.status])}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="!align-middle py-3 text-left">
                        <button
                          type="button"
                          aria-label={`View invoice ${inv.invoiceNo}`}
                          onClick={() => handleView(inv)}
                          className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-16 text-left text-[#64748b]">
                        Tidak ada invoice yang cocok dengan pencarian/filter ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <BillingDetailSheet
            invoice={selectedInvoice}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onRecordPayment={handleRecordPayment}
          />
        </main>
      </div>
    </div>
  );
}
