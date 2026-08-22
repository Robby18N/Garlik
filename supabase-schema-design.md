# Rancangan Skema Supabase — GARLIK (Smile+ Dental Studio)

Dokumen ini adalah **rancangan skema saja** (belum ada instalasi SDK atau koneksi apa pun ke project Supabase manapun), sesuai pilihan: *"Cukup desain skema dulu"*. Setiap tabel di bawah dipetakan langsung dari bentuk data mock yang sudah ada di aplikasi saat ini, supaya begitu suatu saat mau benar-benar disambungkan, tinggal ganti `useState(MOCK_DATA)` dengan query Supabase — tanpa perlu mendesain ulang bentuk datanya.

## Struktur keseluruhan

```
accounts               — akun login (Receptionist / Doctor / Admin)
patients                — data master pasien (dari Records.jsx & Today's Patient)
clinical_notes          — riwayat kunjungan per pasien (visitHistory)
appointments            — janji temu / antrian harian (Today's Patient)
prescriptions           — resep digital (E-Resep)
prescription_items      — baris obat per resep
invoices                — tagihan (Billing)
invoice_items           — baris layanan per invoice
reminder_templates      — template pesan pengingat (H-1, H-0, dst)
reminder_log            — riwayat pengiriman pengingat
rooms                   — status ruang praktik (Activity)
room_queue              — antrian pasien per ruang
activity_log            — log kejadian (dipanggil, selesai, dst)
formulary               — referensi obat (Database)
allergy_interactions     — referensi alergi & interaksi obat
clinical_reference      — referensi diagnosis -> tindakan standar
patient_education        — materi edukasi pasien
patient_education_points — poin-poin per materi edukasi
```

## SQL DDL

```sql
-- ============================================================
-- 1. AKUN & PERAN
-- Menggantikan ACCOUNTS hardcoded di src/context/role-context.jsx.
-- Password sebaiknya TIDAK disimpan di tabel ini sama sekali —
-- gunakan Supabase Auth (auth.users) untuk password/login, dan
-- tabel ini hanya menyimpan profil tambahan (role, nama dokter).
-- ============================================================
create table accounts (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  role          text not null check (role in ('Receptionist', 'Doctor', 'Admin')),
  doctor_name   text,              -- null untuk Receptionist/Admin, mis. 'drg. AN'
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 2. PASIEN
-- Dari Records.jsx (RECORDS_PATIENTS) & dipakai ulang di
-- Today's Patient, Prescription, Billing, dsb.
-- ============================================================
create table patients (
  id                 bigint generated always as identity primary key,
  mrn                text unique not null,        -- 'P-0001'
  name               text not null,
  category           text not null default 'Regular', -- 'VIP' | 'Regular'
  gender             text,                        -- 'Laki-laki' | 'Perempuan'
  age                int,
  phone              text,
  address            text,
  patient_type       text,                        -- 'Umum', dst.
  registered_since   date,
  allergies          text[] default '{}',
  medical_notes      text[] default '{}',
  created_at         timestamptz not null default now()
);

-- ============================================================
-- 3. RIWAYAT KLINIS (visitHistory di Records.jsx / ClinicalTab)
-- ============================================================
create table clinical_notes (
  id            bigint generated always as identity primary key,
  patient_id    bigint not null references patients(id) on delete cascade,
  visit_date    date not null,
  doctor        text not null,        -- 'drg. SM'
  treatment     text,                 -- 'Scaling', 'Tambal Gigi'
  payment       text,                 -- 'Paid' | 'Unpaid'
  diagnosis     text,
  prescription  text,                 -- catatan resep singkat (bukan tabel prescriptions)
  created_at    timestamptz not null default now()
);
create index on clinical_notes (patient_id, visit_date desc);

-- ============================================================
-- 4. APPOINTMENT / ANTRIAN HARIAN (TodaysPatient.jsx)
-- 'bucket' today/tomorrow tidak perlu disimpan — cukup derive dari
-- appt_date dibandingkan dengan tanggal berjalan (sama seperti
-- resolveDayBucket() di frontend sekarang).
-- ============================================================
create table appointments (
  id            bigint generated always as identity primary key,
  patient_id    bigint not null references patients(id) on delete cascade,
  appt_date     date not null,
  appt_time     text not null,        -- '08:30' (disimpan sbg text sesuai format tampilan)
  dokter        text,
  room          text,
  keluhan       text,
  durasi        text,                 -- 'Est. 30 Min'
  status        text not null default 'Waiting 10 Min',
  lab           text,
  remark        text,
  created_at    timestamptz not null default now()
);
create index on appointments (appt_date, status);

-- ============================================================
-- 5. E-RESEP (Prescription.jsx)
-- ============================================================
create table prescriptions (
  id            bigint generated always as identity primary key,
  patient_id    bigint not null references patients(id) on delete cascade,
  doctor        text not null,
  prescribed_at date not null,
  note          text,
  created_at    timestamptz not null default now()
);

create table prescription_items (
  id               bigint generated always as identity primary key,
  prescription_id  bigint not null references prescriptions(id) on delete cascade,
  obat             text not null,
  dosis            text,
  instruksi        text,
  sort_order       int not null default 0
);

-- ============================================================
-- 6. BILLING (Billing.jsx)
-- ============================================================
create table invoices (
  id            bigint generated always as identity primary key,
  invoice_no    text unique not null,     -- 'INV-20260814-001'
  patient_id    bigint not null references patients(id) on delete cascade,
  doctor        text not null,
  invoiced_at   timestamptz not null,
  method        text,                     -- 'Cash' | 'Transfer' | 'Kartu' | null
  status        text not null default 'Unpaid', -- 'Paid' | 'Unpaid' | 'Partial'
  paid_amount   numeric(12,2) not null default 0
);

create table invoice_items (
  id           bigint generated always as identity primary key,
  invoice_id   bigint not null references invoices(id) on delete cascade,
  name         text not null,
  price        numeric(12,2) not null
);

-- ============================================================
-- 7. REMINDERS (Reminders.jsx)
-- ============================================================
create table reminder_templates (
  id       bigint generated always as identity primary key,
  label    text not null,       -- 'H-1 Reminder', 'H-0 Reminder'
  channel  text not null default 'WhatsApp',
  message  text not null,
  active   boolean not null default true
);

create table reminder_log (
  id            bigint generated always as identity primary key,
  patient_id    bigint references patients(id) on delete set null,
  patient_name  text not null,   -- disimpan juga sebagai snapshot nama saat kirim
  type          text not null,   -- 'H-1 Reminder' | 'H-0 Reminder' | 'Follow-up Pasca Tindakan'
  channel       text not null,
  sent_at       timestamptz not null default now(),
  status        text not null    -- 'Terkirim' | 'Dibaca' | 'Gagal'
);

-- ============================================================
-- 8. ACTIVITY / ANTRIAN RUANG (Activity.jsx)
-- ============================================================
create table rooms (
  id       text primary key,      -- 'R1', 'R2', 'R3'
  doctor   text not null,
  status   text not null default 'Available' -- 'Available' | 'Occupied' | 'Cleaning'
);

create table room_current_patient (
  room_id       text primary key references rooms(id) on delete cascade,
  patient_id    bigint references patients(id) on delete set null,
  keluhan       text,
  est_duration  int,             -- menit
  started_at    timestamptz
);

create table room_queue (
  id           bigint generated always as identity primary key,
  room_id      text not null references rooms(id) on delete cascade,
  patient_id   bigint references patients(id) on delete set null,
  appt_time    text,
  keluhan      text,
  wait_min     int,
  sort_order   int not null default 0
);

create table activity_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  action        text not null,   -- 'called' | 'finished' | 'ready' | 'followup'
  room_id       text references rooms(id) on delete set null,
  patient_id    bigint references patients(id) on delete set null,
  doctor        text
);

-- ============================================================
-- 9. REFERENSI KLINIS (Database.jsx) — data statis, cukup di-seed
-- sekali lewat migration/seed script, jarang berubah dari aplikasi.
-- ============================================================
create table formulary (
  id        bigint generated always as identity primary key,
  obat      text not null,
  kategori  text not null,   -- 'Analgesik' | 'Antibiotik' | 'Antiseptik' | 'Preventif'
  dosis     text,
  catatan   text
);

create table allergy_interactions (
  id           bigint generated always as identity primary key,
  alergen      text not null,
  hindari      text,
  alternatif   text
);

create table clinical_reference (
  id          bigint generated always as identity primary key,
  diagnosis   text not null,
  tindakan    text,
  durasi      text
);

create table patient_education (
  id      bigint generated always as identity primary key,
  title   text not null
);

create table patient_education_points (
  id                     bigint generated always as identity primary key,
  patient_education_id   bigint not null references patient_education(id) on delete cascade,
  point                  text not null,
  sort_order             int not null default 0
);
```

## Row Level Security (RLS) — catatan penting

Supabase mengaktifkan RLS per tabel. Karena aplikasi punya 3 peran (Receptionist/Doctor/Admin) dengan akses berbeda-beda (persis seperti `ROLE_ACCESS` di `app-sidebar.jsx` sekarang), setiap tabel di atas nantinya butuh policy, contoh pola untuk `prescriptions`:

```sql
alter table prescriptions enable row level security;

-- Admin: akses penuh
create policy "admin_full_access" on prescriptions
  for all using (
    exists (select 1 from accounts a where a.id = auth.uid() and a.role = 'Admin')
  );

-- Doctor: hanya boleh lihat/tulis resep miliknya sendiri
create policy "doctor_own_prescriptions" on prescriptions
  for all using (
    exists (
      select 1 from accounts a
      where a.id = auth.uid() and a.role = 'Doctor' and a.doctor_name = prescriptions.doctor
    )
  );
```

Pola yang sama (Admin penuh, Doctor terbatas ke datanya sendiri, Receptionist sesuai `ROLE_ACCESS`) perlu direplikasi ke tabel lain sesuai daftar akses yang sudah didefinisikan di `app-sidebar.jsx`.

## View turunan (dibuat paling akhir)

`patients_with_stats` butuh tabel `patients` DAN `clinical_notes` supaya bisa dibuat — jadi ditaruh di sini, setelah semua tabel di atas ada, bukan di dekat tabel `patients` di section 2 (itu bug yang menyebabkan error `relation "clinical_notes" does not exist` kalau script dijalankan urut dari atas).

```sql
-- lastVisit & totalVisits di mock adalah data turunan (derived) dari
-- clinical_notes — sebaiknya dihitung via view, bukan disimpan dobel:
create view patients_with_stats as
select
  p.*,
  (select max(cn.visit_date) from clinical_notes cn where cn.patient_id = p.id) as last_visit,
  (select count(*) from clinical_notes cn where cn.patient_id = p.id) as total_visits
from patients p;
```

## Yang TIDAK dimasukkan dulu

- Tidak ada instalasi `@supabase/supabase-js` atau file `.env` — sesuai pilihan untuk desain dulu.
- Tidak ada migration file Supabase CLI (`supabase/migrations/*.sql`) — SQL di atas bisa langsung ditempel ke Supabase SQL Editor kapan pun siap.
- Belum menentukan strategi auth (email/password vs. tabel `accounts` custom yang sekarang dipakai — perlu diputuskan saat integrasi beneran, karena login sekarang berbasis "pilih akun dari dropdown" bukan email+password asli).

## Langkah kalau nanti mau lanjut ke integrasi beneran

1. Buat project di supabase.com (gratis untuk mulai).
2. Tempel SQL di atas ke SQL Editor project tersebut.
3. Install `@supabase/supabase-js` di project GARLIK.
4. Ganti satu per satu `useState(MOCK_DATA)` di setiap halaman dengan query Supabase (`select`, `insert`, `update`) — disarankan mulai dari satu modul dulu (mis. `patients` + `appointments`) sebagai pilot sebelum menyambungkan semuanya.
