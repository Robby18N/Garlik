import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Moon, Bell, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import AppSidebar from '@/components/app-sidebar';
import Stepper from '@/components/stepper';
import {
  TextField,
  SelectField,
  DateField,
  UploadField,
  SectionHeader,
} from '@/components/form-fields';

const STEPS = ['Input Data Patient', 'Medical Record'];

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

  const [step, setStep] = useState(0);
  const [patientData, setPatientData] = useState(initialPatientData);
  const [medicalData, setMedicalData] = useState(initialMedicalData);
  const [conditions, setConditions] = useState({});

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

  function handleSave() {
    toast.success('Patient registered successfully');
    navigate('/patients');
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
          <Avatar className="size-[30px]">
            <AvatarFallback className="bg-green-100 text-green-700">RN</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AppSidebar activeKey="patients" width={72} />

        <div className="flex-1 overflow-y-auto p-6">
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
                <span className="text-[#0a0a0a]">New Registration</span>
              </div>
            </div>

            <Card className="gap-0 rounded-2xl p-4">
              <div className="border-b border-[#e2e8f0] pb-2">
                <p className="text-base font-semibold text-[#020617]">New Registration</p>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center border-b border-[#e2e8f0] py-8">
                <Stepper steps={STEPS} activeIndex={step} />
              </div>

              {step === 0 ? (
                <form onSubmit={handleNext}>
                  <CardContent className="flex flex-col gap-5 px-0 pt-5">
                    <div className="flex flex-col gap-3">
                      <SectionHeader first>Profile Patient</SectionHeader>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <SelectField
                          label="Title"
                          options={TITLES}
                          value={patientData.title}
                          onChange={(e) => updatePatient('title', e.target.value)}
                        />
                        <TextField
                          label="First Name"
                          required
                          placeholder="Input First Name.."
                          value={patientData.firstName}
                          onChange={(e) => updatePatient('firstName', e.target.value)}
                          className="col-span-2"
                        />
                        <TextField
                          label="Last Name"
                          placeholder="Input Last Name.."
                          value={patientData.lastName}
                          onChange={(e) => updatePatient('lastName', e.target.value)}
                          className="col-span-2"
                        />
                        <TextField
                          label="Nickname"
                          placeholder="Type here.."
                          value={patientData.nickname}
                          onChange={(e) => updatePatient('nickname', e.target.value)}
                        />
                        <TextField
                          label="Birth Place"
                          placeholder="Type here.."
                          value={patientData.birthPlace}
                          onChange={(e) => updatePatient('birthPlace', e.target.value)}
                        />
                        <DateField
                          label="Birth Date"
                          value={patientData.birthDate}
                          onChange={(e) => updatePatient('birthDate', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <SelectField
                          label="Sex"
                          required
                          options={SEXES}
                          value={patientData.sex}
                          onChange={(e) => updatePatient('sex', e.target.value)}
                        />
                        <TextField
                          label="Religion"
                          required
                          placeholder="Type here.."
                          value={patientData.religion}
                          onChange={(e) => updatePatient('religion', e.target.value)}
                          className="col-span-2"
                        />
                        <TextField
                          label="Hobby"
                          placeholder="Type here.."
                          value={patientData.hobby}
                          onChange={(e) => updatePatient('hobby', e.target.value)}
                          className="col-span-2"
                        />
                        <TextField
                          label="Occupation"
                          placeholder="Type here.."
                          value={patientData.occupation}
                          onChange={(e) => updatePatient('occupation', e.target.value)}
                        />
                        <UploadField
                          label="ID Card Photo"
                          fileName={patientData.idCardPhotoName}
                          onFileChange={(e) =>
                            updatePatient('idCardPhotoName', e.target.files?.[0]?.name ?? '')
                          }
                          className="col-span-2"
                        />
                        <TextField
                          label="ID card Number"
                          placeholder="Type here.."
                          value={patientData.idCardNumber}
                          onChange={(e) => updatePatient('idCardNumber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <SectionHeader>Contact &amp; Address</SectionHeader>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <TextField
                          label="Phone Number 1"
                          required
                          placeholder="Input Phone Number.."
                          value={patientData.phone1}
                          onChange={(e) => updatePatient('phone1', e.target.value)}
                        />
                        <TextField
                          label="Phone Number 2"
                          required
                          placeholder="Input Phone Number.."
                          value={patientData.phone2}
                          onChange={(e) => updatePatient('phone2', e.target.value)}
                        />
                        <TextField
                          label="Emergency Contact Name"
                          required
                          placeholder="Type here.."
                          value={patientData.emergencyContactName}
                          onChange={(e) => updatePatient('emergencyContactName', e.target.value)}
                        />
                        <TextField
                          label="Emergency Contact Phone Number"
                          required
                          placeholder="Type here.."
                          value={patientData.emergencyContactPhone}
                          onChange={(e) => updatePatient('emergencyContactPhone', e.target.value)}
                          className="col-span-2"
                        />
                        <TextField
                          label="Email"
                          type="email"
                          placeholder="Type here.."
                          value={patientData.email}
                          onChange={(e) => updatePatient('email', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <TextField
                          label="Street"
                          placeholder="Input Street.."
                          value={patientData.street}
                          onChange={(e) => updatePatient('street', e.target.value)}
                        />
                        <SelectField
                          label="Country"
                          options={COUNTRIES}
                          value={patientData.country}
                          onChange={(e) => updatePatient('country', e.target.value)}
                        />
                        <SelectField
                          label="Province"
                          options={PROVINCES}
                          value={patientData.province}
                          onChange={(e) => updatePatient('province', e.target.value)}
                        />
                        <SelectField
                          label="City"
                          options={CITIES}
                          value={patientData.city}
                          onChange={(e) => updatePatient('city', e.target.value)}
                        />
                        <SelectField
                          label="District"
                          options={DISTRICTS}
                          value={patientData.district}
                          onChange={(e) => updatePatient('district', e.target.value)}
                        />
                        <SelectField
                          label="Sub District"
                          options={SUB_DISTRICTS}
                          value={patientData.subDistrict}
                          onChange={(e) => updatePatient('subDistrict', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <SectionHeader>Membership</SectionHeader>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <DateField label="Date Register" disabled />
                        <TextField
                          label="Guarantee Company"
                          placeholder="Input Guarantee Company"
                          disabled
                        />
                        <TextField
                          label="Relative Name"
                          placeholder="Input Relative Name.."
                          disabled
                        />
                        <SelectField
                          label="Category"
                          options={PATIENT_CATEGORIES}
                          value={patientData.category}
                          onChange={(e) => updatePatient('category', e.target.value)}
                        />
                        <TextField
                          label="Membership Number"
                          placeholder="Type here.."
                          value={patientData.membershipNumber}
                          onChange={(e) => updatePatient('membershipNumber', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <SelectField
                          label="How did you find us?"
                          options={FIND_US_OPTIONS}
                          value={patientData.howDidYouFindUs}
                          onChange={(e) => updatePatient('howDidYouFindUs', e.target.value)}
                          className="col-span-2"
                        />
                        <SelectField
                          label="Relatives"
                          options={RELATIVE_OPTIONS}
                          value={patientData.relatives}
                          onChange={(e) => updatePatient('relatives', e.target.value)}
                          className="col-span-2"
                        />
                      </div>
                    </div>

                    {isAppointmentFlow && (
                      <div className="flex flex-col gap-3">
                        <SectionHeader>Appointment</SectionHeader>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                          <SelectField
                            label="Doctor"
                            options={DOCTORS}
                            value={patientData.appointmentDoctor}
                            onChange={(e) => updatePatient('appointmentDoctor', e.target.value)}
                          />
                          <SelectField
                            label="Room"
                            options={ROOMS}
                            value={patientData.appointmentRoom}
                            onChange={(e) => updatePatient('appointmentRoom', e.target.value)}
                          />
                          <TextField
                            label="Keluhan"
                            placeholder="Type here.."
                            value={patientData.appointmentKeluhan}
                            onChange={(e) => updatePatient('appointmentKeluhan', e.target.value)}
                            className="col-span-2"
                          />
                          <SelectField
                            label="Est. Duration"
                            options={DURATIONS}
                            value={patientData.appointmentDuration}
                            onChange={(e) => updatePatient('appointmentDuration', e.target.value)}
                          />
                          <DateField
                            label="Appointment Date"
                            value={patientData.appointmentDate}
                            onChange={(e) => updatePatient('appointmentDate', e.target.value)}
                          />
                          <TextField
                            label="Appointment Time"
                            type="time"
                            value={patientData.appointmentTime}
                            onChange={(e) => updatePatient('appointmentTime', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
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
              ) : (
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
                      onClick={handleSave}
                      className="min-h-9 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Save
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
