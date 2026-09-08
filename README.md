# BarberBooking - Aplikasi Booking Barbershop UMKM Indonesia

Next.js 14 App Router + Supabase. Pelanggan booking kursi + kapster tanpa WA bolak-balik.

## Fitur MVP
- Layanan (Reguler/Premium/Kids) + Kapster + slot 09:00-21:00
- Anti double-booking per barber_id + overlap jam (trigger DB)
- Notif WA admin 6281289538855
- Admin: list hari ini, confirm/batal

## Jalankan
```bash
npm install
cp .env.example .env.local  # isi NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
npm run dev
```

## Supabase
Jalankan `supabase/schema.sql` di SQL Editor project rkriinnzjdpchtcdtfay.

## Deploy Vercel
Import repo ini di Vercel, isi env Supabase, deploy.
