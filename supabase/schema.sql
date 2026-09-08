-- Barbershop Booking MVP schema (FIX v2: pakai barber_bookings biar tidak tabrakan dengan tabel bookings Rental Sedulur)
-- Jalankan di SQL Editor Supabase project rkriinnzjdpchtcdtfay
-- Aman dijalankan ulang (idempotent)

create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  foto text,
  aktif boolean not null default true
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  harga integer not null default 0,
  durasi_menit integer not null default 30
);

create table if not exists barber_bookings (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  nama_pelanggan text not null,
  wa text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','selesai','batal')),
  created_at timestamptz not null default now()
);

-- Cegah double-booking: overlap jam per barber + tanggal (abaikan yang batal)
-- Nama trigger & fungsi dibedakan dari rental (trg_cegah_overlap) biar tidak saling hapus
create or replace function cegah_overlap_barber()
returns trigger as $$
begin
  if new.jam_selesai <= new.jam_mulai then
    raise exception 'Jam selesai harus setelah jam mulai';
  end if;
  if exists (
    select 1 from barber_bookings b
    where b.barber_id = new.barber_id
      and b.tanggal = new.tanggal
      and b.status in ('pending','confirmed')
      and (new.id is null or b.id <> new.id)
      and b.jam_mulai < new.jam_selesai
      and b.jam_selesai > new.jam_mulai
  ) then
    raise exception 'Slot sudah dibooking untuk kapster ini';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cegah_overlap_barber on barber_bookings;
create trigger trg_cegah_overlap_barber
before insert or update on barber_bookings
for each row execute function cegah_overlap_barber();

create index if not exists idx_barber_bookings_barber_tgl on barber_bookings(barber_id, tanggal);

-- RLS
alter table barbers enable row level security;
alter table services enable row level security;
alter table barber_bookings enable row level security;

drop policy if exists "select semua" on barbers;
create policy "select semua" on barbers for select using (true);
drop policy if exists "select semua" on services;
create policy "select semua" on services for select using (true);
drop policy if exists "select semua" on barber_bookings;
create policy "select semua" on barber_bookings for select using (true);
drop policy if exists "insert semua" on barber_bookings;
create policy "insert semua" on barber_bookings for insert with check (true);
drop policy if exists "update semua" on barber_bookings;
create policy "update semua" on barber_bookings for update using (true);

-- Seed contoh (aman dijalankan ulang)
insert into barbers (nama, foto, aktif) values
  ('Andi', null, true),
  ('Budi', null, true),
  ('Ciko', null, true)
on conflict do nothing;

insert into services (nama, harga, durasi_menit) values
  ('Potong Reguler', 30000, 30),
  ('Potong + Cuci', 45000, 45),
  ('Full Grooming', 80000, 60)
on conflict do nothing;

-- PENTING: script versi lama sempat DROP trigger rental (trg_cegah_overlap on bookings).
-- Jalankan blok di bawah untuk memastikan trigger rental tetap ada:
-- (copy dari /home/ubuntu/RentalSedulur/supabase/schema.sql)
create or replace function cegah_overlap() returns trigger as $$
begin
  if exists (
    select 1 from bookings
    where unit_id = NEW.unit_id
      and status in ('pending','confirmed')
      and daterange(tgl_mulai, tgl_selesai, '[]') && daterange(NEW.tgl_mulai, NEW.tgl_selesai, '[]')
      and id <> NEW.id
  ) then
    raise exception 'Unit % sudah dibooking di rentang % s/d %', NEW.unit_id, NEW.tgl_mulai, NEW.tgl_selesai;
  end if;
  return NEW;
end; $$ language plpgsql;

drop trigger if exists trg_cegah_overlap on bookings;
create trigger trg_cegah_overlap before insert or update on bookings
for each row execute function cegah_overlap();
