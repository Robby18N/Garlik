import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Moon, Bell, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import AppSidebar from '@/components/app-sidebar';
import AccountMenu from '@/components/account-menu';
import Stepper from '@/components/stepper';
import {
  TextField,
  SelectField,
  DateField,
  UploadField,
  SectionHeader,
  FieldRow,
} from '@/components/form-fields';
import { resolveDayBucket } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { generateNextMrn } from '@/lib/patients';

// "HH:MM" for a walk-in registration's Appt column (no appointment was
// actually booked) — same hand-rolled format used everywhere else in the
// app instead of toLocaleTimeString's locale-dependent separator.
function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Flex-grow ratio + minimum width (px) for each field, proportional to the
// exact pixel widths measured off Figma node 469:2356's Input Field
// instances — so narrow fields (Title, Sex) stay narrow and wide ones
// (First Name, Phone Number) stay wide, instead of every field in a row
// being forced to the same width.
const W = (px) => ({ flexGrow: px, flexBasis: `${px}px` });

const STEPS_DEFAULT = ['Input Data Patient', 'Medical Record'];
// The "make an appointment" flow (reached from the toolbar search / "Patient
// not yet registered" popups) gets its own dedicated third step instead of
// cramming the appointment fields into step 1 — mirrors Figma's Stepper
// component pattern used elsewhere in the app (see stepper.jsx).
const STEPS_WITH_APPOINTMENT = ['Input Data Patient', 'Medical Record', 'Appointment'];

// Kept identical to the values used across the Today's Patient table so a
// registration made here (name/category/doctor/room/duration) is never out
// of sync with what the table can display.
const PATIENT_CATEGORIES = ['Regular', 'VIP', 'VVIP'];
const DOCTORS = ['drg. SM', 'drg. AN', 'drg. RF'];
const ROOMS = ['R1', 'R2', 'R3'];
const DURATIONS = ['30 Min', '45 Min', '60 Min', '90 Min'];

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr'];
const SEXES = ['Male', 'Female'];
const COUNTRIES = ['Indonesia'];
const PROVINCES = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten'];
const CITIES = ['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara'];
const DISTRICTS = ['Kebayoran Baru', 'Tebet', 'Setiabudi', 'Mampang Prapatan'];
const SUB_DISTRICTS = ['Senayan', 'Gunung', 'Melawai', 'Pulo'];
const FIND_US_OPTIONS = ['Social Media', 'Friend/Family Referral', 'Google Search', 'Walk-in', 'Advertisement'];
const RELATIVE_OPTIONS = ['None', 'Spouse', 'Parent', 'Child', 'Sibling', 'Other'];

const BLOOD_TYPES = ['A', 'AB', 'O'];

// Row-major order so a 3-column grid reproduces the design's layout exactly.
const CONDITION_FIELDS = [
  ['bleeding', 'Bleeding'],
  ['gastritis', 'Gastritis'],
  ['rheumaticFever', 'Rheumatic Fever'],
  ['highBloodPleasure', 'High Blood Pleasure'],
  ['asthma', 'Asthma'],
  ['lungProblem', 'Lung Problem'],
  ['bloodThinningMedication', 'Taking Blood-thinning Medication'],
  ['sinus', 'Sinus'],
  ['liverProblem', 'Liver Problem'],
  ['hepatitis', 'Hepatitis'],
  ['hyperthyoid', 'Hyperthyoid'],
  ['kidneyProblem', 'Kidney Problem'],
  ['hivInfection', 'HIV Infection'],
  ['diabetes', 'Diabetes'],
  ['heartDisease', 'Heart Disease'],
  ['osteoporosis', 'Osteoporosis'],
  ['pregnant', 'Pregnant'],
  ['smokingHabit', 'Smoking Habit'],
  ['hypothyroid', 'Hypothyroid'],
  ['arthitis', 'Arthitis'],
];

const initialPatientData = {
  title: '',
  firstName: '',
  lastName: '',
  nickname: '',
  birthPlace: '',
  birthDate: '',
  sex: '',
  religion: '',
  hobby: '',
  occupation: '',
  idCardPhotoName: '',
  idCardNumber: '',
  phone1: '',
  phone2: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  email: '',
  street: '',
  country: '',
  province: '',
  city: '',
  district: '',
  subDistrict: '',
  category: '',
  membershipNumber: '',
  howDidYouFindUs: '',
  relatives: '',
  // Appointment fields — only surfaced for the "make appointment" flow, but
  // these are exactly the fields Today's Patient's table needs per row
  // (Dokter / Room / Keluhan / Est. Dur / Appt) that a plain intake form
  // was previously missing.
  appointmentDoctor: '',
  appointmentRoom: '',
  appointmentKeluhan: '',
  appointmentDuration: '',
  appointmentDate: '',
  appointmentTime: '',
};

const initialMedicalData = {
  bloodType: '',
  relative: '',
  physicianName: '',
  physicianPhone: '',
  drugConsumption: '',
  allergyHistory: '',
  fileName: '',
};

function YesNoField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex items-center gap-6">
        {['Yes', 'No'].map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
          >
            <input
              type="radio"
              className="size-4 accent-green-600"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Registration() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAppointmentFlow = location.state?.flow === 'make-appointment';
  const STEPS = isAppointmentFlow ? STEPS_WITH_APPOINTMENT : STEPS_DEFAULT;

  const [step, setStep] = useState(0);
  const [patientData, setPatientData] = useState(initialPatientData);
  const [medicalData, setMedicalData] = useState(initialMedicalData);
  const [conditions, setConditions] = useState({});
  const [saving, setSaving] = useState(false);

  function updatePatient(field, value) {
    setPatientData((prev) => ({ ...prev, [field]: value }));
  }

  function updateMedical(field, value) {
    setMedicalData((prev) => ({ ...prev, [field]: value }));
  }

  function updateCondition(field, value) {
    setConditions((prev) => ({ ...prev, [field]: value }));
  }

  function handleBack() {
    navigate('/patients');
  }

  function handleNext(e) {
    e.preventDefault();
    const required = [
      ['firstName', 'First Name'],
      ['sex', 'Sex'],
      ['religion', 'Religion'],
      ['phone1', 'Phone Number 1'],
      ['phone2', 'Phone Number 2'],
      ['emergencyContactName', 'Emergency Contact Name'],
      ['emergencyContactPhone', 'Emergency Contact Phone Number'],
    ];
    const missing = required.find(([field]) => !patientData[field]);
    if (missing) {
      toast.error(`Please fill in ${missing[1]}`);
      return;
    }
    setStep(1);
  }

  function handleFileSubmit() {
    toast.success(
      medicalData.fileName
        ? `${medicalData.fileName} attached`
        : 'No file selected'
    );
  }

  function handleNextFromMedicalRecord() {
    if (isAppointmentFlow) {
      setStep(2);
      return;
    }
    handleSave();
  }

  // Age isn't collected directly — it's derived from Birth Date, same idea
  // as patients_with_stats deriving lastVisit/totalVisits instead of
  // storing them redundantly. Returns null when no birth date was entered
  // (the field isn't required).
  function computeAge(birthDateStr) {
    if (!birthDateStr) return null;
    const dob = new Date(`${birthDateStr}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const hadBirthdayThisYear =
      now.getMonth() > dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age;
  }

  async function handleSave() {
    if (saving) return;
    const fullName = `${patientData.firstName} ${patientData.lastName}`.trim();

    let appointmentFields = null;
    if (isAppointmentFlow) {
      const required = [
        ['appointmentDoctor', 'Doctor'],
        ['appointmentRoom', 'Room'],
        ['appointmentDate', 'Appointment Date'],
        ['appointmentTime', 'Appointment Time'],
      ];
      const missing = required.find(([field]) => !patientData[field]);
      if (missing) {
        toast.error(`Please fill in ${missing[1]}`);
        return;
      }
      const bucket = resolveDayBucket(patientData.appointmentDate);
      appointmentFields = {
        appt_date: patientData.appointmentDate,
        appt_time: patientData.appointmentTime,
        dokter: patientData.appointmentDoctor,
        room: patientData.appointmentRoom,
        keluhan: patientData.appointmentKeluhan || '-',
        durasi: patientData.appointmentDuration || '-',
        // "WL" (Waiting List — neutral, no claimed elapsed time), not
        // "Waiting 10 Min": this patient hasn't waited any amount of time
        // yet, they were just registered. Staff bump it to "Waiting 10
        // Min"/"Waiting 20 Min" once that's actually true. See
        // TodaysPatient's STATUS_STYLES.
        status: bucket === 'today' ? 'WL' : null,
        lab: '-',
        remark: '-',
      };
    } else {
      // A plain walk-in registration has no doctor/room/appointment info at
      // all (those fields only exist in the appointment flow's step 3), so
      // it still lands in Today's list — that's where the receptionist is
      // working from — but with placeholder clinical fields until an
      // appointment is actually booked for this patient separately.
      appointmentFields = {
        appt_date: new Date().toISOString().slice(0, 10),
        appt_time: nowTimeLabel(),
        dokter: '-',
        room: '-',
        keluhan: 'Registrasi Baru',
        durasi: '-',
        status: 'WL',
        lab: '-',
        remark: '-',
      };
    }

    setSaving(true);
    try {
      const mrn = await generateNextMrn();
      const markedConditions = Object.entries(conditions)
        .filter(([, value]) => value === 'Yes')
        .map(([field]) => CONDITION_FIELDS.find(([key]) => key === field)?.[1] ?? field);

      const { data: insertedPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          mrn,
          name: fullName,
          category: patientData.category || 'Regular',
          gender:
            patientData.sex === 'Male' ? 'Laki-laki' : patientData.sex === 'Female' ? 'Perempuan' : null,
          age: computeAge(patientData.birthDate),
          phone: patientData.phone1,
          address: patientData.street || null,
          registered_since: new Date().toISOString().slice(0, 10),
          allergies: medicalData.allergyHistory ? [medicalData.allergyHistory] : [],
          medical_notes: markedConditions,
        })
        .select('id')
        .single();

      if (patientError) throw patientError;

      const { error: appointmentError } = await supabase.from('appointments').insert({
        patient_id: insertedPatient.id,
        ...appointmentFields,
      });

      if (appointmentError) throw appointmentError;

      toast.success(
        isAppointmentFlow
          ? 'Patient registered and appointment booked successfully'
          : 'Patient registered successfully'
      );
      navigate('/patients');
    } catch (error) {
      console.error('Failed to save registration to Supabase', error);
      toast.error('Gagal menyimpan data pasien — coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f5f6f8]">
      {/* Top brand bar (GARLIK | Platfrom), matches Figma node 469:2482 */}
      <header className="flex h-[50px] w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#87c341] to-[#03a83d]">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          <p className="text-base leading-none">
            <span className="font-bold text-green-600">GARLIK</span>{' '}
            <span className="text-slate-400">| Platfrom</span>
          </p>
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AppSidebar activeKey="patients" width={72} />

        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {/* Breadcrumb — matches Figma node 469:2478 */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="flex size-6 items-center justify-center text-slate-700 hover:text-slate-900"
              >
                <ArrowLeft className="size-6" />
              </button>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-[#64748b]">Today Patient</span>
                <ChevronRight className="size-3.5 text-[#64748b]" />
                <span className="text-[#0a0a0a]">
                  {isAppointmentFlow ? 'Registration & Appointment' : 'New Registration'}
                </span>
              </div>
            </div>

            <Card className="gap-0 rounded-2xl p-4">
              <div className="border-b border-[#e2e8f0] pb-2">
                <p className="text-base font-semibold text-[#020617]">
                  {isAppointmentFlow ? 'Registration & Appointment' : 'New Registration'}
                </p>
              </div>

              {/* Stepper — Figma's stepper band sits on a faint dot-grid texture */}
              <div className="relative flex items-center justify-center overflow-hidden border-b border-[#e2e8f0] py-6">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />
                <Stepper steps={STEPS} activeIndex={step} className="relative" />
              </div>

              {step === 0 ? (
                <form onSubmit={handleNext}>
                  <CardContent className="flex flex-col gap-5 px-0 pt-5">
                    <div className="flex flex-col gap-3">
                      <SectionHeader first>Profile Patient</SectionHeader>
                      <FieldRow>
                        <SelectField
                          label="Title"
                          options={TITLES}
                          value={patientData.title}
                          onChange={(e) => updatePatient('title', e.target.value)}
                          style={W(100)}
                        />
                        <TextField
                          label="First Name"
                          required
                          placeholder="Input First Name.."
                          value={patientData.firstName}
                          onChange={(e) => updatePatient('firstName', e.target.value)}
                          style={W(270)}
                        />
                        <TextField
                          label="Last Name"
                          placeholder="Input Last Name.."
                          value={patientData.lastName}
                          onChange={(e) => updatePatient('lastName', e.target.value)}
                          style={W(270)}
                        />
                        <TextField
                          label="Nickname"
                          placeholder="Type here.."
                          value={patientData.nickname}
                          onChange={(e) => updatePatient('nickname', e.target.value)}
                          style={W(259)}
                        />
                        <TextField
                          label="Birth Place"
                          placeholder="Type here.."
                          value={patientData.birthPlace}
                          onChange={(e) => updatePatient('birthPlace', e.target.value)}
                          style={W(172)}
                        />
                        <DateField
                          label="Birth Date"
                          iconPosition="right"
                          value={patientData.birthDate}
                          onChange={(e) => updatePatient('birthDate', e.target.value)}
                          style={W(172)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <SelectField
                          label="Sex"
                          required
                          options={SEXES}
                          value={patientData.sex}
                          onChange={(e) => updatePatient('sex', e.target.value)}
                          style={W(100)}
                        />
                        <TextField
                          label="Religion"
                          required
                          placeholder="Type here.."
                          value={patientData.religion}
                          onChange={(e) => updatePatient('religion', e.target.value)}
                          style={W(230)}
                        />
                        <TextField
                          label="Hobby"
                          placeholder="Type here.."
                          value={patientData.hobby}
                          onChange={(e) => updatePatient('hobby', e.target.value)}
                          style={W(230)}
                        />
                        <TextField
                          label="Occupation"
                          placeholder="Type here.."
                          value={patientData.occupation}
                          onChange={(e) => updatePatient('occupation', e.target.value)}
                          style={W(230)}
                        />
                        <UploadField
                          label="ID Card Photo"
                          fileName={patientData.idCardPhotoName}
                          onFileChange={(e) =>
                            updatePatient('idCardPhotoName', e.target.files?.[0]?.name ?? '')
                          }
                          style={W(290)}
                        />
                        <TextField
                          label="ID card Number"
                          placeholder="Type here.."
                          value={patientData.idCardNumber}
                          onChange={(e) => updatePatient('idCardNumber', e.target.value)}
                          style={W(150)}
                        />
                      </FieldRow>
                    </div>

                    <div className="flex flex-col gap-3">
                      <SectionHeader>Contact &amp; Address</SectionHeader>
                      <FieldRow>
                        <TextField
                          label="Phone Number 1"
                          required
                          placeholder="Input Phone Number.."
                          value={patientData.phone1}
                          onChange={(e) => updatePatient('phone1', e.target.value)}
                          style={W(220)}
                        />
                        <TextField
                          label="Phone Number 2"
                          required
                          placeholder="Input Phone Number.."
                          value={patientData.phone2}
                          onChange={(e) => updatePatient('phone2', e.target.value)}
                          style={W(220)}
                        />
                        <TextField
                          label="Emergency Contact Name"
                          required
                          placeholder="Type here.."
                          value={patientData.emergencyContactName}
                          onChange={(e) => updatePatient('emergencyContactName', e.target.value)}
                          style={W(230)}
                        />
                        <TextField
                          label="Emergency Contact Phone Number"
                          required
                          placeholder="Type here.."
                          value={patientData.emergencyContactPhone}
                          onChange={(e) => updatePatient('emergencyContactPhone', e.target.value)}
                          style={W(330)}
                        />
                        <TextField
                          label="Email"
                          type="email"
                          placeholder="Type here.."
                          value={patientData.email}
                          onChange={(e) => updatePatient('email', e.target.value)}
                          style={W(150)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <TextField
                          label="Street"
                          placeholder="Input Street.."
                          value={patientData.street}
                          onChange={(e) => updatePatient('street', e.target.value)}
                          style={W(309)}
                        />
                        <SelectField
                          label="Country"
                          options={COUNTRIES}
                          value={patientData.country}
                          onChange={(e) => updatePatient('country', e.target.value)}
                          style={W(187)}
                        />
                        <SelectField
                          label="Province"
                          options={PROVINCES}
                          value={patientData.province}
                          onChange={(e) => updatePatient('province', e.target.value)}
                          style={W(187)}
                        />
                        <SelectField
                          label="City"
                          options={CITIES}
                          value={patientData.city}
                          onChange={(e) => updatePatient('city', e.target.value)}
                          style={W(187)}
                        />
                        <SelectField
                          label="District"
                          options={DISTRICTS}
                          value={patientData.district}
                          onChange={(e) => updatePatient('district', e.target.value)}
                          style={W(187)}
                        />
                        <SelectField
                          label="Sub District"
                          options={SUB_DISTRICTS}
                          value={patientData.subDistrict}
                          onChange={(e) => updatePatient('subDistrict', e.target.value)}
                          style={W(187)}
                        />
                      </FieldRow>
                    </div>

                    <div className="flex flex-col gap-3">
                      <SectionHeader>Membership</SectionHeader>
                      <FieldRow>
                        <DateField label="Date Register" disabled style={W(270)} />
                        <TextField
                          label="Guarantee Company"
                          placeholder="Input Guarantee Company"
                          disabled
                          style={W(270)}
                        />
                        <TextField
                          label="Relative Name"
                          placeholder="Input Relative Name.."
                          disabled
                          style={W(259)}
                        />
                        <SelectField
                          label="Category"
                          options={PATIENT_CATEGORIES}
                          value={patientData.category}
                          onChange={(e) => updatePatient('category', e.target.value)}
                          style={W(205)}
                        />
                        <TextField
                          label="Membership Number"
                          placeholder="Type here.."
                          value={patientData.membershipNumber}
                          onChange={(e) => updatePatient('membershipNumber', e.target.value)}
                          style={W(252)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <SelectField
                          label="How did you find us?"
                          options={FIND_US_OPTIONS}
                          value={patientData.howDidYouFindUs}
                          onChange={(e) => updatePatient('howDidYouFindUs', e.target.value)}
                          style={W(270)}
                        />
                        <SelectField
                          label="Relatives"
                          options={RELATIVE_OPTIONS}
                          value={patientData.relatives}
                          onChange={(e) => updatePatient('relatives', e.target.value)}
                          style={W(270)}
                        />
                      </FieldRow>
                    </div>

                  </CardContent>

                  <div className="flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-0 pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="min-h-9 rounded-lg border border-solid border-[#ef4444] px-6 py-2.5 text-sm font-medium text-[#ef4444] hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="min-h-9 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Next
                    </button>
                  </div>
                </form>
              ) : step === 1 ? (
                <div>
                  <CardContent className="flex flex-col gap-6 px-0 pt-5">
                    <div>
                      <SectionHeader first>Medical Record</SectionHeader>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <Label className="text-sm font-medium text-slate-700">
                          Blood Type
                        </Label>
                        <div className="flex items-center gap-6">
                          {BLOOD_TYPES.map((type) => (
                            <label
                              key={type}
                              className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                            >
                              <input
                                type="radio"
                                className="size-4 accent-green-600"
                                checked={medicalData.bloodType === type}
                                onChange={() => updateMedical('bloodType', type)}
                              />
                              {type}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-[#e2e8f0] pt-6 sm:grid-cols-3">
                        {CONDITION_FIELDS.map(([field, label]) => (
                          <YesNoField
                            key={field}
                            label={label}
                            value={conditions[field]}
                            onChange={(value) => updateCondition(field, value)}
                          />
                        ))}
                      </div>

                      <div className="mt-6 border-t border-[#e2e8f0] pt-6">
                        <TextField
                          label="Relative with other patient"
                          placeholder="Enter"
                          value={medicalData.relative}
                          onChange={(e) => updateMedical('relative', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#e2e8f0] pt-6">
                      <SectionHeader first>Doctor of Physician</SectionHeader>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <TextField
                          label="Name"
                          placeholder="Enter"
                          value={medicalData.physicianName}
                          onChange={(e) =>
                            updateMedical('physicianName', e.target.value)
                          }
                        />
                        <TextField
                          label="Drug Consumption & Other Sickness"
                          required
                          placeholder="Enter"
                          value={medicalData.drugConsumption}
                          onChange={(e) =>
                            updateMedical('drugConsumption', e.target.value)
                          }
                        />
                        <TextField
                          label="Phone"
                          placeholder="Enter"
                          value={medicalData.physicianPhone}
                          onChange={(e) =>
                            updateMedical('physicianPhone', e.target.value)
                          }
                        />
                        <TextField
                          label="Allergy History"
                          placeholder="Enter"
                          value={medicalData.allergyHistory}
                          onChange={(e) =>
                            updateMedical('allergyHistory', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#e2e8f0] pt-6">
                      <SectionHeader first>Supporting Files X-rays or other</SectionHeader>
                      <div className="mt-3 flex items-center gap-3">
                        <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500">
                          <Upload className="size-4 text-slate-400" />
                          {medicalData.fileName || 'Choose File  No file chosen'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              updateMedical(
                                'fileName',
                                e.target.files?.[0]?.name ?? ''
                              )
                            }
                          />
                        </label>
                        <Button
                          type="button"
                          onClick={handleFileSubmit}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          Submit
                        </Button>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">Upload a file</p>
                    </div>
                  </CardContent>

                  <div className="flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-0 pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="min-h-9 rounded-lg border border-solid border-[#ef4444] px-6 py-2.5 text-sm font-medium text-[#ef4444] hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFromMedicalRecord}
                      disabled={!isAppointmentFlow && saving}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {!isAppointmentFlow && saving && <Loader2 className="size-4 animate-spin" />}
                      {isAppointmentFlow ? 'Next' : saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <CardContent className="flex flex-col gap-5 px-0 pt-5">
                    <div className="flex flex-col gap-3">
                      <SectionHeader first>Appointment</SectionHeader>
                      <p className="text-sm text-[#64748b]">
                        Tentukan jadwal appointment untuk{' '}
                        <span className="font-medium text-[#020617]">
                          {patientData.firstName || 'pasien ini'}
                        </span>
                        .
                      </p>
                      <FieldRow>
                        <SelectField
                          label="Doctor"
                          required
                          options={DOCTORS}
                          value={patientData.appointmentDoctor}
                          onChange={(e) => updatePatient('appointmentDoctor', e.target.value)}
                          style={W(172)}
                        />
                        <SelectField
                          label="Room"
                          required
                          options={ROOMS}
                          value={patientData.appointmentRoom}
                          onChange={(e) => updatePatient('appointmentRoom', e.target.value)}
                          style={W(172)}
                        />
                        <TextField
                          label="Keluhan"
                          placeholder="Type here.."
                          value={patientData.appointmentKeluhan}
                          onChange={(e) => updatePatient('appointmentKeluhan', e.target.value)}
                          style={W(270)}
                        />
                        <SelectField
                          label="Est. Duration"
                          options={DURATIONS}
                          value={patientData.appointmentDuration}
                          onChange={(e) => updatePatient('appointmentDuration', e.target.value)}
                          style={W(172)}
                        />
                        <DateField
                          label="Appointment Date"
                          required
                          iconPosition="right"
                          value={patientData.appointmentDate}
                          onChange={(e) => updatePatient('appointmentDate', e.target.value)}
                          style={W(172)}
                        />
                        <TextField
                          label="Appointment Time"
                          required
                          type="time"
                          value={patientData.appointmentTime}
                          onChange={(e) => updatePatient('appointmentTime', e.target.value)}
                          style={W(172)}
                        />
                      </FieldRow>
                    </div>
                  </CardContent>

                  <div className="flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-0 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="min-h-9 rounded-lg border border-solid border-[#e2e8f0] px-6 py-2.5 text-sm font-medium text-[#334155] hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
