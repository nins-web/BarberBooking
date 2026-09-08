import { NextRequest, NextResponse } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function tambahMenit(jam: string, menit: number) {
  const [h, m] = jam.split(':').map(Number)
  const t = h * 60 + m + menit
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`
}

// GET: list booking (filter barber_id+tanggal, atau tanggal saja untuk admin)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const barber_id = q.get('barber_id')
  const tanggal = q.get('tanggal')
  if (!URL || !KEY) return NextResponse.json({ bookings: [] })
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(URL, KEY)
  let query = db.from('bookings').select('*, barbers(nama), services(nama,harga)').order('jam_mulai')
  if (barber_id) query = query.eq('barber_id', barber_id)
  if (tanggal) query = query.eq('tanggal', tanggal)
  query = query.neq('status', 'batal')
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data })
}

// POST: buat booking + cek overlap per barber
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { barber_id, service_id, tanggal, jam_mulai, nama_pelanggan, wa } = body
  if (!barber_id || !service_id || !tanggal || !jam_mulai || !nama_pelanggan || !wa) {
    return NextResponse.json({ error: 'Lengkapi semua field: kapster, layanan, tanggal, jam, nama, WA.' }, { status: 400 })
  }
  if (!URL || !KEY) {
    // Mode tanpa env (preview): anggap sukses
    return NextResponse.json({ booking: { id: 'demo-' + Date.now() } })
  }
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(URL, KEY)

  const { data: svc } = await db.from('services').select('durasi_menit').eq('id', service_id).single()
  const durasi = svc?.durasi_menit ?? 30
  const jam_selesai = tambahMenit(jam_mulai.length === 5 ? jam_mulai : jam_mulai.slice(0, 5), durasi)
  const mulai = jam_mulai.length === 5 ? jam_mulai + ':00' : jam_mulai

  // Cek overlap
  const { data: bentrok } = await db
    .from('bookings')
    .select('id')
    .eq('barber_id', barber_id)
    .eq('tanggal', tanggal)
    .in('status', ['pending', 'confirmed'])
    .lt('jam_mulai', jam_selesai)
    .gt('jam_selesai', mulai)
    .limit(1)
  if (bentrok?.length) {
    return NextResponse.json({ error: 'Slot sudah dibooking untuk kapster ini. Pilih jam lain.' }, { status: 409 })
  }

  const { data, error } = await db
    .from('bookings')
    .insert({ barber_id, service_id, tanggal, jam_mulai: mulai, jam_selesai, nama_pelanggan, wa, status: 'pending' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data })
}

// PATCH: ubah status (admin konfirmasi/batal)
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  if (!id || !['confirmed', 'batal', 'selesai'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 })
  }
  if (!URL || !KEY) return NextResponse.json({ ok: true })
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(URL, KEY)
  const { error } = await db.from('bookings').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
