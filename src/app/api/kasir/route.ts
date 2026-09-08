import { NextRequest, NextResponse } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const KOMISI = 20000

// GET: list transaksi (filter tanggal, mis. /api/kasir?tanggal=2026-09-08)
export async function GET(req: NextRequest) {
  const tanggal = req.nextUrl.searchParams.get('tanggal')
  if (!URL || !KEY) return NextResponse.json({ transaksi: [] })
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(URL, KEY)
  let query = db
    .from('barber_transactions')
    .select('*, barbers(nama), services(nama,harga)')
    .order('created_at', { ascending: false })
  if (tanggal) query = query.eq('tanggal', tanggal)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transaksi: data })
}

// POST: catat transaksi. Body: { barber_id, service_id, metode, tanggal? }
// Harga diambil dari tabel services, komisi tetap 20000.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { barber_id, service_id, metode, tanggal } = body
  if (!barber_id || !service_id) {
    return NextResponse.json({ error: 'Pilih kapster dan layanan dulu.' }, { status: 400 })
  }
  if (metode && !['Tunai', 'QRIS'].includes(metode)) {
    return NextResponse.json({ error: 'Metode harus Tunai atau QRIS.' }, { status: 400 })
  }
  if (!URL || !KEY) {
    return NextResponse.json({ transaksi: { id: 'demo-' + Date.now(), harga: 0, komisi: KOMISI, metode: metode ?? 'Tunai' } })
  }
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(URL, KEY)
  const { data: svc, error: svcErr } = await db
    .from('services')
    .select('harga')
    .eq('id', service_id)
    .single()
  if (svcErr || !svc) {
    return NextResponse.json({ error: 'Layanan tidak ditemukan.' }, { status: 400 })
  }
  const { data, error } = await db
    .from('barber_transactions')
    .insert({
      barber_id,
      service_id,
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      harga: svc.harga,
      metode: metode ?? 'Tunai',
      komisi: KOMISI,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transaksi: data })
}
