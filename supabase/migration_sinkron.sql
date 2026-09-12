-- Sinkron backend barber-booking: rapikan duplikat + pastikan tabel kasir ada.
-- Jalankan di Supabase SQL Editor. Aman dijalankan ulang (idempotent).
--
-- Konteks: tabel barbers & services terisi 4x lipat (12 baris, seharusnya 3).
-- barber_bookings masih KOSONG (0 baris) jadi aman: yang dipertahankan adalah
-- baris TERTUA per nama, sisanya dihapus. Tidak ada booking yang terdampak.

-- 1) Hapus duplikat barbers (simpan 1 tertua per nama)
delete from barbers a using barbers b
where a.ctid > b.ctid
  and lower(trim(a.nama)) = lower(trim(b.nama));

-- 2) Hapus duplikat services (simpan 1 tertua per nama)
delete from services a using services b
where a.ctid > b.ctid
  and lower(trim(a.nama)) = lower(trim(b.nama));

-- 3) Tabel kasir (sama seperti supabase/kasir.sql, idempotent)
create table if not exists barber_transactions (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  tanggal date not null default current_date,
  jam time not null default now(),
  harga integer not null default 0 check (harga >= 0),
  metode text not null default 'Tunai' check (metode in ('Tunai','QRIS')),
  komisi integer not null default 20000 check (komisi >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_barber_transactions_tanggal on barber_transactions(tanggal);
create index if not exists idx_barber_transactions_barber_tgl on barber_transactions(barber_id, tanggal);

alter table barber_transactions enable row level security;

drop policy if exists "select semua" on barber_transactions;
create policy "select semua" on barber_transactions for select using (true);
drop policy if exists "insert semua" on barber_transactions;
create policy "insert semua" on barber_transactions for insert with check (true);
drop policy if exists "update semua" on barber_transactions;
create policy "update semua" on barber_transactions for update using (true);

-- 4) Verifikasi: harusnya 3 dan 3
select 'barbers' as tabel, count(*) from barbers
union all select 'services', count(*) from services;
