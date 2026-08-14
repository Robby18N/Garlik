import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Upload, Moon, Bell } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AppSidebar from '@/components/app-sidebar';
import { cn } from '@/lib/utils';

const STEPS = ['Input Data Patient', 'Medical Record'];

const PATIENT_CATEGORIES = ['Regular', 'VIP', 'VVIP'];

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
  fullName: '',
  phone: '',
  email: '',
  nik: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  category: '',
  appointmentDoctor: '',
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

function FieldInput({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-white px-3 shadow-xs focus-within:border-slate-400">
        <Input
          className="h-auto p-0 text-sm placeholder:text-slate-400 focus-visible:ring-0"
          {...props}
        />
      </div>
    </div>
  );
}

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
    if (!patientData.fullName || !patientData.phone) {
      toast.error('Please fill in the patient name and phone number');
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
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            {/* Breadcrumb */}
            <button
              type="button"
              onClick={handleBack}
              className="flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="size-4" />
              <span className="text-green-600">Today Patient</span>
              <span>/</span>
              <span className="font-medium text-slate-900">New Registration</span>
            </button>

        <Card className="p-0">
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-base font-semibold text-slate-900">
              New Registration
            </CardTitle>
          </CardHeader>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-3 px-6 py-8">
            {STEPS.map((label, index) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border-2',
                      index < step && 'border-green-600 bg-green-600 text-white',
                      index === step && 'border-green-600 bg-white',
                      index > step && 'border-slate-300 bg-white'
                    )}
                  >
                    {index < step ? (
                      <Check className="size-3.5" />
                    ) : (
                      <div
                        className={cn(
                          'size-2 rounded-full',
                          index === step ? 'bg-green-600' : 'bg-transparent'
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm',
                      index === step
                        ? 'font-medium text-slate-900'
                        : 'text-slate-400'
                    )}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="mb-6 h-px w-24 bg-green-600" />
                )}
              </div>
            ))}
          </div>

          {step === 0 ? (
            <form onSubmit={handleNext}>
              <CardContent className="flex flex-col gap-6 border-t pt-6">
                <div>
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Patient Information
                  </p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <FieldInput
                      label="Full Name"
                      placeholder="Enter"
                      value={patientData.fullName}
                      onChange={(e) => updatePatient('fullName', e.target.value)}
                    />
                    <FieldInput
                      label="Phone Number"
                      placeholder="Enter"
                      value={patientData.phone}
                      onChange={(e) => updatePatient('phone', e.target.value)}
                    />
                    <FieldInput
                      label="Email"
                      type="email"
                      placeholder="Enter"
                      value={patientData.email}
                      onChange={(e) => updatePatient('email', e.target.value)}
                    />
                    <FieldInput
                      label="NIK / ID Number"
                      placeholder="Enter"
                      value={patientData.nik}
                      onChange={(e) => updatePatient('nik', e.target.value)}
                    />
                    <FieldInput
                      label="Date of Birth"
                      type="date"
                      value={patientData.dateOfBirth}
                      onChange={(e) =>
                        updatePatient('dateOfBirth', e.target.value)
                      }
                    />
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        Gender
                      </Label>
                      <div className="flex h-10 items-center gap-6">
                        {['Male', 'Female'].map((option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                          >
                            <input
                              type="radio"
                              className="size-4 accent-green-600"
                              checked={patientData.gender === option}
                              onChange={() => updatePatient('gender', option)}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <FieldInput
                      label="Address"
                      placeholder="Enter"
                      value={patientData.address}
                      onChange={(e) => updatePatient('address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Patient Category
                  </p>
                  <div className="flex gap-3">
                    {PATIENT_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => updatePatient('category', category)}
                        className={cn(
                          'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                          patientData.category === category
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {isAppointmentFlow && (
                  <div className="border-t pt-6">
                    <p className="mb-4 text-sm font-semibold text-slate-900">
                      Appointment
                    </p>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                      <FieldInput
                        label="Doctor"
                        placeholder="Enter"
                        value={patientData.appointmentDoctor}
                        onChange={(e) =>
                          updatePatient('appointmentDoctor', e.target.value)
                        }
                      />
                      <FieldInput
                        label="Appointment Date"
                        type="date"
                        value={patientData.appointmentDate}
                        onChange={(e) =>
                          updatePatient('appointmentDate', e.target.value)
                        }
                      />
                      <FieldInput
                        label="Appointment Time"
                        type="time"
                        value={patientData.appointmentTime}
                        onChange={(e) =>
                          updatePatient('appointmentTime', e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Next
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <CardContent className="flex flex-col gap-6 border-t pt-6">
                <div>
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Medical Record
                  </p>
                  <div className="flex flex-col gap-1.5">
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

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-3">
                    {CONDITION_FIELDS.map(([field, label]) => (
                      <YesNoField
                        key={field}
                        label={label}
                        value={conditions[field]}
                        onChange={(value) => updateCondition(field, value)}
                      />
                    ))}
                  </div>

                  <div className="mt-6 border-t pt-6">
                    <FieldInput
                      label="Relative with other patient"
                      placeholder="Enter"
                      value={medicalData.relative}
                      onChange={(e) => updateMedical('relative', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Doctor of Physician
                  </p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <FieldInput
                      label="Name"
                      placeholder="Enter"
                      value={medicalData.physicianName}
                      onChange={(e) =>
                        updateMedical('physicianName', e.target.value)
                      }
                    />
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        Drug Consumption &amp; Other Sickness
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-white px-3 shadow-xs focus-within:border-slate-400">
                        <Input
                          className="h-auto p-0 text-sm placeholder:text-slate-400 focus-visible:ring-0"
                          placeholder="Enter"
                          required
                          value={medicalData.drugConsumption}
                          onChange={(e) =>
                            updateMedical('drugConsumption', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <FieldInput
                      label="Phone"
                      placeholder="Enter"
                      value={medicalData.physicianPhone}
                      onChange={(e) =>
                        updateMedical('physicianPhone', e.target.value)
                      }
                    />
                    <FieldInput
                      label="Allergy History"
                      placeholder="Enter"
                      value={medicalData.allergyHistory}
                      onChange={(e) =>
                        updateMedical('allergyHistory', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Supporting Files X-rays or other
                  </p>
                  <div className="flex items-center gap-3">
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

              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Save
                </Button>
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
