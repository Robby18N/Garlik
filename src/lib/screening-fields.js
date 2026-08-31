// Shared between the Screening page (src/pages/Screening.jsx) and the
// "Skrining" column's hover card in Today's Patient
// (src/components/screening-status-cell.jsx), so both places label the same
// condition keys identically instead of drifting apart.
//
// This is a short, per-visit front-desk triage checklist — distinct from
// the much longer doctor-level medical history checklist captured once at
// New Registration (see Registration.jsx's own CONDITION_FIELDS, which
// covers different, English-labeled fields and is stored on the patient
// record itself rather than per visit).
export const CONDITION_FIELDS = [
  ['alergiObat', 'Alergi Obat'],
  ['riwayatJantung', 'Riwayat Penyakit Jantung'],
  ['hipertensi', 'Hipertensi'],
  ['diabetes', 'Diabetes'],
  ['kehamilan', 'Sedang Hamil'],
  ['pendarahan', 'Riwayat Pendarahan Berlebih'],
];

export function conditionLabel(key) {
  return CONDITION_FIELDS.find(([k]) => k === key)?.[1] ?? key;
}

export function flaggedConditionLabels(conditions) {
  return Object.entries(conditions ?? {})
    .filter(([, value]) => value === 'Yes')
    .map(([key]) => conditionLabel(key));
}
