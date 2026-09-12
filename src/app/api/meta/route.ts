import { NextResponse } from 'next/server'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, supabase } from '@/lib/supabase'

// Satu pintu data live: kapster + layanan (terdedupe per nama).
// Fallback ke data dummy saat DB kosong / env belum diisi.
export async function GET() {
  try {
    const [b, s] = await Promise.all([
      supabase.from('barbers').select('id,nama,foto,aktif').order('nama'),
      supabase.from('services').select('id,nama,harga,durasi_menit').order('harga'),
    ])
    const dedupe = <T extends { nama?: string }>(rows: T[] | null, fb: T[]) => {
      if (!rows?.length) return fb
      const seen = new Set<string>()
      return rows.filter((x) => {
        const k = (x.nama ?? '').trim().toLowerCase()
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
    }
    return NextResponse.json({
      barbers: dedupe(b.data, FALLBACK_BARBERS),
      services: dedupe(s.data, FALLBACK_SERVICES),
    })
  } catch {
    return NextResponse.json({ barbers: FALLBACK_BARBERS, services: FALLBACK_SERVICES })
  }
}
