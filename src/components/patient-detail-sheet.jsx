import * as React from 'react'
import { Phone, AlertTriangle, Info, CalendarClock } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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

const TABS = ['History', 'Detail Patient', 'Medical Record', 'Appointment']

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
              Kunjungan Terakhir
            </span>
            <span className="text-[13px] text-muted-foreground">
              {visit.date ?? '-'}
            </span>
          </div>
          <div className="text-[13px] text-foreground">
            {visit.treatment ? `Riwayat Treatment : ${visit.treatment}` : '-'}
          </div>
          {visit.doctor && (
            <div className="text-[13px] font-semibold text-foreground">
              {visit.doctor}
            </div>
          )}
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

export default function PatientDetailSheet({ patient, open, onOpenChange }) {
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
              {activeTab === 'Appointment' && <AppointmentTab patient={patient} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
