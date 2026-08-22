-- ============================================================
-- Seed data untuk pilot migrasi "Today's Patient" (patients +
-- appointments) — memindahkan 33 pasien contoh (21 hari ini + 12 besok)
-- yang sebelumnya hidup sebagai MOCK_PATIENTS / MOCK_PATIENTS_TOMORROW
-- di TodaysPatient.jsx, supaya tabelnya sudah ada isinya begitu
-- halaman mulai membaca dari Supabase asli.
--
-- Aman dijalankan SEKALI SAJA — kolom mrn di tabel patients bersifat
-- unique, jadi kalau script ini dijalankan dua kali, baris kedua akan
-- gagal karena mrn duplikat (bukan malah menggandakan data pasien).
--
-- Jalankan di SQL Editor project "Garlik", setelah tabel-tabel dari
-- supabase-schema-design.md sudah ada.
-- ============================================================

-- Perbaikan kecil pada skema: kolom status appointment perlu boleh
-- kosong (null) untuk appointment besok yang belum berjalan — di
-- skema awal kolom ini "not null", padahal Today's Patient menampilkan
-- "-" untuk status appointment yang belum terjadi.
alter table appointments alter column status drop not null;

-- 1) Pasien — 21 pasien hari ini + 12 pasien besok, mrn P-0001..P-0033
insert into patients (mrn, name, category, phone) values
('P-0001', 'Agung Wijaya Kusuma', 'VIP', '0813-2037-6091'),
('P-0002', 'Siti Rahmawati', 'Regular', '0821-2074-6182'),
('P-0003', 'Budi Santoso', 'Regular', '0822-2111-6273'),
('P-0004', 'Dewi Lestari', 'VVIP', '0851-2148-6364'),
('P-0005', 'Andi Pratama', 'Regular', '0852-2185-6455'),
('P-0006', 'Rina Marlina', 'VIP', '0895-2222-6546'),
('P-0007', 'Fajar Hidayat', 'Regular', '0896-2259-6637'),
('P-0008', 'Nur Aisyah', 'Regular', '0812-2296-6728'),
('P-0009', 'Dimas Saputra', 'Regular', '0813-2333-6819'),
('P-0010', 'Maya Sari', 'Regular', '0821-2370-6910'),
('P-0011', 'Rizky Ramadhan', 'Regular', '0822-2407-7001'),
('P-0012', 'Putri Amelia', 'VIP', '0851-2444-7092'),
('P-0013', 'Arif Setiawan', 'Regular', '0852-2481-7183'),
('P-0014', 'Lina Wulandari', 'Regular', '0895-2518-7274'),
('P-0015', 'Yoga Pratama', 'Regular', '0896-2555-7365'),
('P-0016', 'Intan Permata', 'VVIP', '0812-2592-7456'),
('P-0017', 'Wahyu Nugroho', 'Regular', '0813-2629-7547'),
('P-0018', 'Nadia Putri', 'Regular', '0821-2666-7638'),
('P-0019', 'Ilham Maulana', 'Regular', '0822-2703-7729'),
('P-0020', 'Vina Oktaviani', 'Regular', '0851-2740-7820'),
('P-0021', 'Reza Kurniawan', 'Regular', '0852-2777-7911'),
('P-0022', 'Hendra Gunawan', 'Regular', '0852-5737-6191'),
('P-0023', 'Melati Suryani', 'VIP', '0895-5774-6282'),
('P-0024', 'Bayu Kusnandar', 'Regular', '0896-5811-6373'),
('P-0025', 'Citra Dewanti', 'VVIP', '0812-5848-6464'),
('P-0026', 'Doni Firmansyah', 'Regular', '0813-5885-6555'),
('P-0027', 'Eka Purnama', 'Regular', '0821-5922-6646'),
('P-0028', 'Galih Prasetyo', 'Regular', '0822-5959-6737'),
('P-0029', 'Herlina Wati', 'VIP', '0851-5996-6828'),
('P-0030', 'Indra Gunawan', 'Regular', '0852-6033-6919'),
('P-0031', 'Jasmine Anggraini', 'Regular', '0895-6070-7010'),
('P-0032', 'Krisna Ardiansyah', 'Regular', '0896-6107-7101'),
('P-0033', 'Lestari Handayani', 'Regular', '0812-6144-7192');

-- 2) Appointment — appt_date memakai current_date (hari ini) / current_date + 1
--    (besok) supaya bucket Today/Tomorrow di aplikasi selalu benar mengikuti
--    tanggal berjalan, bukan tanggal yang dibekukan saat seed ini dijalankan.
insert into appointments
  (patient_id, appt_date, appt_time, dokter, room, keluhan, durasi, status, lab, remark)
select p.id, v.appt_date, v.appt_time, v.dokter, v.room, v.keluhan, v.durasi, v.status, v.lab, v.remark
from (values
  -- Hari ini
  ('P-0001', current_date, '08:30', 'drg. SM', 'R1', 'Gigi Ngilu / Sensitive', '45 Min', 'Complete'::text, 'OK', 'Pasien sudah mengeluh ingin segera di treatment'),
  ('P-0002', current_date, '08:45', 'drg. AN', 'R2', 'Gigi Berlubang', '60 Min', 'Waiting 10 Min', 'OK', 'Pasien Kondusif'),
  ('P-0003', current_date, '09:00', 'drg. SM', 'R1', 'Scaling', '45 Min', 'Late', 'NOK', 'Pasien Telat Datang'),
  ('P-0004', current_date, '09:15', 'drg. RF', 'R3', 'Sakit Gigi', '60 Min', 'Cancel', 'NOK', 'Pasien Kondusif'),
  ('P-0005', current_date, '09:30', 'drg. AN', 'R2', 'Tambal Gigi', '45 Min', 'Waiting 10 Min', 'OK', 'Waktu tunggu meningkat, berpotensi menghambat antrian'),
  ('P-0006', current_date, '09:45', 'drg. SM', 'R1', 'Gigi Sensitif', '30 Min', 'Waiting 20 Min', 'OK', 'Proses berjalan sesuai estimasi, antrian kondusif'),
  ('P-0007', current_date, '10:00', 'drg. RF', 'R3', 'Cabut Gigi', '60 Min', 'Waiting 10 Min', 'OK', 'Pasien belum dipanggil, antrian mulai padat'),
  ('P-0008', current_date, '10:15', 'drg. AN', 'R2', 'Karang Gigi', '45 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  ('P-0009', current_date, '10:30', 'drg. SM', 'R1', 'Gigi Berlubang', '60 Min', 'Waiting 20 Min', 'OK', 'Pasien sudah mengeluh ingin segera di treatment'),
  ('P-0010', current_date, '10:45', 'drg. RF', 'R3', 'Konsultasi', '30 Min', 'Late', 'NOK', 'Pasien Telat Datang'),
  ('P-0011', current_date, '11:00', 'drg. AN', 'R2', 'Sakit Gusi', '45 Min', 'Cancel', 'NOK', 'Pasien cancel'),
  ('P-0012', current_date, '11:15', 'drg. SM', 'R1', 'Whitening', '90 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  ('P-0013', current_date, '11:30', 'drg. RF', 'R3', 'Gigi Patah', '60 Min', 'Waiting 10 Min', 'OK', 'Pasien Kondusif'),
  ('P-0014', current_date, '11:45', 'drg. AN', 'R2', 'Scaling', '45 Min', 'Waiting 10 Min', 'OK', 'Pasien Kondusif'),
  ('P-0015', current_date, '12:00', 'drg. SM', 'R1', 'Tambal Gigi', '45 Min', 'Waiting 20 Min', 'OK', 'Waktu tunggu meningkat, berpotensi menghambat antrian'),
  ('P-0016', current_date, '13:00', 'drg. RF', 'R3', 'Gigi Ngilu', '30 Min', 'Waiting 20 Min', 'OK', 'Pasien sudah mengeluh ingin segera di treatment'),
  ('P-0017', current_date, '13:15', 'drg. AN', 'R2', 'Gigi Berlubang', '60 Min', 'Waiting 20 Min', 'OK', 'Pasien belum dipanggil, antrian mulai padat'),
  ('P-0018', current_date, '13:30', 'drg. SM', 'R1', 'Konsultasi', '30 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  ('P-0019', current_date, '13:45', 'drg. RF', 'R3', 'Cabut Gigi', '60 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  ('P-0020', current_date, '14:00', 'drg. AN', 'R2', 'Karang Gigi', '45 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  ('P-0021', current_date, '14:15', 'drg. SM', 'R1', 'Sakit Gigi', '60 Min', 'Waiting 20 Min', 'OK', 'Pasien Kondusif'),
  -- Besok — status kosong (belum berjalan), room/lab/remark "-" seperti mock aslinya
  ('P-0022', current_date + 1, '08:00', 'drg. SM', '-', 'Kontrol Kawat Gigi', '30 Min', null::text, '-', '-'),
  ('P-0023', current_date + 1, '08:30', 'drg. AN', '-', 'Cabut Gigi Bungsu', '90 Min', null::text, '-', '-'),
  ('P-0024', current_date + 1, '09:00', 'drg. RF', '-', 'Gigi Berlubang', '45 Min', null::text, '-', '-'),
  ('P-0025', current_date + 1, '09:30', 'drg. SM', '-', 'Whitening', '90 Min', null::text, '-', '-'),
  ('P-0026', current_date + 1, '10:00', 'drg. AN', '-', 'Scaling', '45 Min', null::text, '-', '-'),
  ('P-0027', current_date + 1, '10:30', 'drg. RF', '-', 'Sakit Gusi', '30 Min', null::text, '-', '-'),
  ('P-0028', current_date + 1, '11:00', 'drg. SM', '-', 'Tambal Gigi', '45 Min', null::text, '-', '-'),
  ('P-0029', current_date + 1, '11:30', 'drg. AN', '-', 'Konsultasi Behel', '30 Min', null::text, '-', '-'),
  ('P-0030', current_date + 1, '13:00', 'drg. RF', '-', 'Gigi Ngilu', '45 Min', null::text, '-', '-'),
  ('P-0031', current_date + 1, '13:30', 'drg. SM', '-', 'Karang Gigi', '45 Min', null::text, '-', '-'),
  ('P-0032', current_date + 1, '14:00', 'drg. AN', '-', 'Cabut Gigi', '60 Min', null::text, '-', '-'),
  ('P-0033', current_date + 1, '14:30', 'drg. RF', '-', 'Sakit Gigi', '60 Min', null::text, '-', '-')
) as v(mrn, appt_date, appt_time, dokter, room, keluhan, durasi, status, lab, remark)
join patients p on p.mrn = v.mrn;
