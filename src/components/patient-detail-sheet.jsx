import * as React from 'react'
import { Phone, AlertTriangle, Info, CalendarClock, Lock, Stethoscope, Pill, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRole } from '@/context/role-context'

// "14 Aug 2026" style label matching the short human-readable date format
// used everywhere else in the mock data (visitHistory.date, registeredSince,
// etc.) — a real clinical note added here should read identically to the
// seeded ones instead of introducing a different date format just for
// freshly-added entries.
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function todayLabel() {
  const d = new Date()
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// Payment status shown alongside each visit in the History tab — same flat
// badge language as the Today's Patient status column.
const PAYMENT_STYLES = {
  Paid: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  Unpaid: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  Partial: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
}

function PaymentBadge({ status }) {
  if (!status) return null
  return (
    <Badge className={cn('rounded-full px-2 py-0.5 text-[11px]', PAYMENT_STYLES[status] ?? PAYMENT_STYLES.Unpaid)}>
      {status}
    </Badge>
  )
}

// Matches the verified category colors from Figma node 555:869 (the
// Nama-column hover card) so the tag reads identically everywhere it appears.
const CATEGORY_STYLES = {
  VVIP: 'bg-[#b453090d] text-[#b45309] border-[#b4530933]',
  VIP: 'bg-[#218c210d] text-[#218c21] border-[#218c2133]',
  Regular: 'bg-[#64748b0d] text-[#64748b] border-[#64748b33]',
}

function CategoryBadge({ category }) {
  if (!category) return null
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Regular
  return (
    <Badge variant="outline" className={cn('rounded-full font-medium', style)}>
      {category}
    </Badge>
  )
}

function InfoPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
      {children}
    </span>
  )
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

const TABS = ['History', 'Detail Patient', 'Medical Record', 'Clinical', 'Appointment']

function HistoryTab({ patient }) {
  const visits = patient.visitHistory?.length
    ? patient.visitHistory
    : patient.lastVisit
      ? [patient.lastVisit]
      : []

  if (!visits.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        No visit history available.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {visits.map((visit, i) => (
        <div
          key={i}
          className="flex w-full flex-col gap-1 rounded-xl border border-border bg-white p-[17px]"
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">
              {i === 0 ? 'Kunjungan Terakhir' : 'Kunjungan'}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {visit.date ?? '-'}
            </span>
          </div>
          <div className="text-[13px] text-foreground">
            {visit.treatment ? `Riwayat Treatment : ${visit.treatment}` : '-'}
          </div>
          <div className="flex items-center justify-between gap-2">
            {visit.doctor && (
              <div className="text-[13px] font-semibold text-foreground">
                {visit.doctor}
              </div>
            )}
            <PaymentBadge status={visit.payment} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailPatientTab({ patient }) {
  const rows = [
    ['Medical Record No.', patient.mrn],
    ['Age', patient.age != null ? `${patient.age} Thn` : undefined],
    ['Gender', patient.gender],
    ['Phone', patient.phone],
    ['Address', patient.address],
    ['Patient Type', patient.patientType],
  ].filter(([, value]) => value)

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        No patient details available.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-white p-[17px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex w-full items-center justify-between gap-4">
          <span className="text-[13px] text-muted-foreground">{label}</span>
          <span className="text-right text-[13px] font-medium text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

function MedicalRecordTab({ patient }) {
  const allergies = patient.allergies ?? []
  const conditions = patient.medicalNotes ?? []

  if (!allergies.length && !conditions.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        No medical record on file.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {allergies.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <div className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Allergies
          </div>
          <div className="flex flex-wrap gap-2">
            {allergies.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#ffdad6] bg-[rgba(255,218,214,0.3)] px-[13px] py-[7px] text-[13px] text-[#ba1a1a]"
              >
                <AlertTriangle className="size-3.5" />
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      {conditions.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <div className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Conditions
          </div>
          <div className="flex flex-wrap gap-2">
            {conditions.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[rgba(222,135,18,0.3)] bg-[rgba(222,135,18,0.1)] px-[13px] py-[7px] text-[13px] text-[#de8712]"
              >
                <Info className="size-3.5" />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Small inline form for a Doctor to record today's diagnosis + prescription
// against this patient — appended to the top of the Clinical tab once
// saved. Kept inline (rather than a separate dialog) so it stays visually
// attached to the record it's being added to.
function AddClinicalNoteForm({ doctorName, onCancel, onSave }) {
  const [diagnosis, setDiagnosis] = React.useState('')
  const [prescription, setPrescription] = React.useState('')

  function handleSave() {
    if (!diagnosis.trim()) return
    onSave({
      date: todayLabel(),
      doctor: doctorName,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim() || 'Tidak ada',
    })
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-slate-50/60 p-[17px]">
      <p className="text-xs font-semibold tracking-wide text-foreground uppercase">Catatan Klinis Baru</p>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Diagnosa</label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={2}
          placeholder="Mis. Karies dentin M1 kanan bawah"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] text-foreground outline-none focus:border-slate-300"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Resep</label>
        <textarea
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          rows={2}
          placeholder="Mis. Asam Mefenamat 500mg 3x1 (opsional)"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] text-foreground outline-none focus:border-slate-300"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="h-8 rounded-full text-xs">
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!diagnosis.trim()}
          className="h-8 rounded-full bg-green-600 text-xs text-white hover:bg-green-700"
        >
          Simpan
        </Button>
      </div>
    </div>
  )
}

// Clinical detail (diagnosis + prescription per visit) is intentionally
// locked for every role except Doctor — Receptionist and Admin can see
// that visits happened (History tab) and basic medical background
// (Medical Record tab) but not the clinical judgment behind them. Doctor
// additionally gets a "+ Tambah Catatan" action here (via onAddNote) so
// this tab is a real read/write clinical record instead of read-only.
function ClinicalTab({ patient, onAddNote }) {
  const { role, doctorName } = useRole()
  const [adding, setAdding] = React.useState(false)
  const visits = patient.visitHistory?.filter((v) => v.diagnosis || v.prescription) ?? []

  if (role !== 'Doctor') {
    return (
      <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-slate-50/60 p-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Lock className="size-4" />
        </div>
        <p className="text-[13px] font-medium text-foreground">Akses terbatas</p>
        <p className="max-w-[280px] text-[13px] text-muted-foreground">
          Detail klinis (diagnosa &amp; resep) hanya dapat diakses oleh role Dokter.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {onAddNote && (
        adding ? (
          <AddClinicalNoteForm
            doctorName={doctorName}
            onCancel={() => setAdding(false)}
            onSave={(note) => {
              onAddNote(patient.id, note)
              setAdding(false)
            }}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAdding(true)}
            className="h-9 w-full justify-center gap-1.5 rounded-xl border-dashed text-sm text-slate-600"
          >
            <Plus className="size-4" />
            Tambah Catatan Klinis
          </Button>
        )
      )}

      {!visits.length ? (
        <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
          No clinical record available.
        </div>
      ) : (
        visits.map((visit, i) => (
          <div key={i} className="flex w-full flex-col gap-2.5 rounded-xl border border-border bg-white p-[17px]">
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">{visit.date ?? '-'}</span>
              <span className="text-[13px] text-muted-foreground">{visit.doctor}</span>
            </div>
            {visit.diagnosis && (
              <div className="flex items-start gap-2 text-[13px] text-foreground">
                <Stethoscope className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <span><span className="font-semibold">Diagnosa:</span> {visit.diagnosis}</span>
              </div>
            )}
            {visit.prescription && (
              <div className="flex items-start gap-2 text-[13px] text-foreground">
                <Pill className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <span><span className="font-semibold">Resep:</span> {visit.prescription}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function AppointmentTab({ patient }) {
  const appointments = patient.appointments ?? []

  if (!appointments.length) {
    return (
      <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">
        <CalendarClock className="size-5" />
        No upcoming appointments.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {appointments.map((appt, i) => (
        <div
          key={i}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-[17px]"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-foreground">
              {appt.reason ?? 'Appointment'}
            </span>
            {appt.doctor && (
              <span className="text-[13px] text-muted-foreground">{appt.doctor}</span>
            )}
          </div>
          <span className="text-[13px] text-muted-foreground">{appt.date ?? '-'}</span>
        </div>
      ))}
    </div>
  )
}

export default function PatientDetailSheet({ patient, open, onOpenChange, onAddClinicalNote }) {
  const [activeTab, setActiveTab] = React.useState(TABS[0])

  React.useEffect(() => {
    if (open) setActiveTab(TABS[0])
  }, [open, patient?.id])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {!patient ? (
          <SheetHeader className="border-b">
            <SheetTitle>Patient Detail</SheetTitle>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="border-b px-6 py-6">
              <SheetTitle className="text-lg">Detail Pasien</SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
              {/* Patient Profile Summary */}
              <div className="flex w-full items-start gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-sky-500 text-lg font-bold text-[#003751]">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {patient.name ?? 'Unknown Patient'}
                    </h3>
                    <CategoryBadge category={patient.category} />
                  </div>
                  {patient.mrn && (
                    <div className="text-[13px] font-medium text-muted-foreground">
                      {patient.mrn}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {patient.patientType && <InfoPill>{patient.patientType}</InfoPill>}
                    {patient.age != null && <InfoPill>{patient.age} Thn</InfoPill>}
                    {patient.gender && <InfoPill>{patient.gender}</InfoPill>}
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Phone className="size-3.5" />
                      {patient.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Alerts */}
              {(patient.allergies?.length > 0 || patient.medicalNotes?.length > 0) && (
                <div className="flex w-full flex-col gap-2">
                  <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    Medical Alerts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies?.map((a, i) => (
                      <span
                        key={`al-${i}`}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-[#ffdad6] bg-[rgba(255,218,214,0.3)] px-[13px] py-[7px] text-[13px] text-[#ba1a1a]"
                      >
                        <AlertTriangle className="size-3.5" />
                        {a}
                      </span>
                    ))}
                    {patient.medicalNotes?.map((c, i) => (
                      <span
                        key={`mn-${i}`}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-[rgba(222,135,18,0.3)] bg-[rgba(222,135,18,0.1)] px-[13px] py-[7px] text-[13px] text-[#de8712]"
                      >
                        <Info className="size-3.5" />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs Navigation */}
              <div className="flex w-full flex-col border-b border-border">
                <div className="flex items-start gap-4 overflow-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'shrink-0 cursor-pointer border-b-2 border-transparent pb-2.5 text-xs font-semibold tracking-wide text-muted-foreground',
                        activeTab === tab && 'border-blue-500 text-blue-500'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'History' && <HistoryTab patient={patient} />}
              {activeTab === 'Detail Patient' && <DetailPatientTab patient={patient} />}
              {activeTab === 'Medical Record' && <MedicalRecordTab patient={patient} />}
              {activeTab === 'Clinical' && <ClinicalTab patient={patient} onAddNote={onAddClinicalNote} />}
              {activeTab === 'Appointment' && <AppointmentTab patient={patient} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
