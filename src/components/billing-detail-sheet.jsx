import { useEffect, useState } from 'react';
import { Printer, Send, CheckCircle2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  Paid: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Unpaid: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  Partial: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

// Klinik tidak menerima BPJS sebagai metode pembayaran — hanya metode yang
// dibayar tunai/penuh saat itu juga.
const PAYMENT_METHODS = ['Cash', 'Transfer', 'Kartu'];

export function formatRupiah(value) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

/**
 * Invoice detail sheet for the Billing menu — itemized treatment lines,
 * outstanding balance, and (for Unpaid/Partial invoices) a form to record
 * a payment. "Cetak Kwitansi" / "Kirim via WhatsApp" are simulated with a
 * toast, matching the rest of the app's mocked side-effect pattern
 * (no real printer/WA integration in this demo).
 */
export default function BillingDetailSheet({ invoice, open, onOpenChange, onRecordPayment }) {
  const [method, setMethod] = useState('Cash');
  const [amount, setAmount] = useState('');

  const outstanding = invoice ? invoice.total - invoice.paidAmount : 0;

  useEffect(() => {
    if (open && invoice) {
      setMethod(invoice.method ?? 'Cash');
      setAmount(String(invoice.total - invoice.paidAmount));
    }
  }, [open, invoice]);

  function handleRecordPayment() {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      toast.error('Masukkan jumlah pembayaran yang valid');
      return;
    }
    onRecordPayment(invoice.id, method, Math.min(parsed, outstanding));
  }

  function handlePrint() {
    toast.success(`Kwitansi ${invoice.invoiceNo} berhasil dicetak`);
  }

  function handleSendWhatsapp() {
    toast.success(`Kwitansi ${invoice.invoiceNo} terkirim via WhatsApp ke ${invoice.patientName}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {!invoice ? (
          <SheetHeader className="border-b">
            <SheetTitle>Detail Invoice</SheetTitle>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="border-b px-6 py-6">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="text-lg">{invoice.invoiceNo}</SheetTitle>
                <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[invoice.status])}>
                  {invoice.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-foreground">{invoice.patientName}</p>
                <p className="text-[13px] text-muted-foreground">{invoice.mrn}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                  <span>{invoice.doctor}</span>
                  <span>&middot;</span>
                  <span>{invoice.date}</span>
                </div>
              </div>

              {/* Itemized treatment lines */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                  Rincian Tindakan
                </h4>
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-[17px]">
                  {invoice.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px]">
                      <span className="text-foreground">{item.name}</span>
                      <span className="font-medium text-foreground">{formatRupiah(item.price)}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-[13px] font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatRupiah(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment status / record payment */}
              {invoice.status === 'Paid' ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[rgba(34,197,94,0.06)] p-4">
                  <CheckCircle2 className="size-5 shrink-0 text-[#16a34a]" />
                  <div className="flex flex-col">
                    <p className="text-[13px] font-medium text-foreground">Lunas dibayar via {invoice.method}</p>
                    <p className="text-[13px] text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-[17px]">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Sisa Tagihan</span>
                    <span className="font-semibold text-[#ef4444]">{formatRupiah(outstanding)}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Metode Pembayaran</label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Jumlah Dibayar</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-9 rounded-md border border-input px-3"
                    />
                  </div>

                  <Button
                    onClick={handleRecordPayment}
                    className="h-9 w-full rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Receipt className="size-4" />
                    Catat Pembayaran
                  </Button>
                </div>
              )}
            </div>

            <SheetFooter className="flex-row border-t">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="h-9 flex-1 rounded-full text-sm font-medium"
              >
                <Printer className="size-4" />
                Cetak Kwitansi
              </Button>
              <Button
                onClick={handleSendWhatsapp}
                className="h-9 flex-1 rounded-full bg-green-600 text-sm font-medium text-white hover:bg-green-700"
              >
                <Send className="size-4" />
                Kirim via WhatsApp
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
