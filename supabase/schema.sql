-- Barbershop Booking MVP schema
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

create table if not exists bookings (
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
create or replace function cegah_overlap_booking()
returns trigger as $$
begin
  if new.jam_selesai <= new.jam_mulai then
    raise exception 'Jam selesai harus setelah jam mulai';
  end if;
  if exists (
    select 1 from bookings b
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

drop trigger if exists trg_cegah_overlap on bookings;
create trigger trg_cegah_overlap
before insert or update on bookings
for each row execute function cegah_overlap_booking();

create index if not exists idx_bookings_barber_tgl on bookings(barber_id, tanggal);

-- RLS
alter table barbers enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;

drop policy if exists "select semua" on barbers;
create policy "select semua" on barbers for select using (true);
drop policy if exists "select semua" on services;
create policy "select semua" on services for select using (true);
drop policy if exists "select semua" on bookings;
create policy "select semua" on bookings for select using (true);
drop policy if exists "insert semua" on bookings;
create policy "insert semua" on bookings for insert with check (true);
drop policy if exists "update semua" on bookings;
create policy "update semua" on bookings for update using (true);

-- Seed contoh
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
