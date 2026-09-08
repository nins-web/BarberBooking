-- Kasir v1: tabel transaksi barber (thin)
-- Jalankan di SQL Editor Supabase. Aman dijalankan ulang (idempotent).

create table if not exists barber_transactions (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  tanggal date not null default current_date,
  jam time not null default now(),
  harga integer not null default 0,
  metode text not null default 'Tunai' check (metode in ('Tunai','QRIS')),
  komisi integer not null default 20000,
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
