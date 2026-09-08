import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(url && key)

// Fallback dummy agar build tanpa env tidak crash.
// Runtime: halaman pakai FALLBACK_* di bawah saat env kosong.
export const supabase =
  url && key
    ? createClient(url, key)
    : ((new Proxy(
        {},
        {
          get: () => () => ({
            select: () => ({ order: () => Promise.resolve({ data: null, error: null }) }),
            from: () => ({ select: () => ({ order: () => Promise.resolve({ data: null, error: null }) }) }),
          }),
          apply: () => Promise.resolve({ data: null }),
        },
      ) as unknown) as ReturnType<typeof createClient>)

if (!hasSupabaseEnv) {
  console.warn('Supabase env belum diisi - pakai fallback dummy untuk build/preview')
  ;(supabase as unknown as Record<string, unknown>).from = () =>
    ({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({ order: () => Promise.resolve({ data: null, error: null }) }),
      }),
    } as unknown)
}

export type Barber = { id: string; nama: string; foto: string | null; aktif: boolean }
export type Service = { id: string; nama: string; harga: number; durasi_menit: number }
export type Booking = {
  id: string
  barber_id: string
  service_id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  nama_pelanggan: string
  wa: string
  status: string
}

export const FALLBACK_BARBERS: Barber[] = [
  { id: 'b1', nama: 'Andi', foto: null, aktif: true },
  { id: 'b2', nama: 'Budi', foto: null, aktif: true },
  { id: 'b3', nama: 'Ciko', foto: null, aktif: true },
]

export const FALLBACK_SERVICES: Service[] = [
  { id: 's1', nama: 'Potong Reguler', harga: 30000, durasi_menit: 30 },
  { id: 's2', nama: 'Potong + Cuci', harga: 45000, durasi_menit: 45 },
  { id: 's3', nama: 'Full Grooming', harga: 80000, durasi_menit: 60 },
]

export const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
