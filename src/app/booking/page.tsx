'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, rupiah } from '@/lib/supabase'

const SLOTS = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)

type BookingRow = { jam_mulai: string; jam_selesai: string; status: string }

function tambahMenit(jam: string, menit: number) {
  const [h, m] = jam.split(':').map(Number)
  const t = h * 60 + m + menit
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export default function BookingPage() {
  const router = useRouter()
  const [barbers] = useState(FALLBACK_BARBERS)
  const [services] = useState(FALLBACK_SERVICES)
  const [barberId, setBarberId] = useState(FALLBACK_BARBERS[0].id)
  const [serviceId, setServiceId] = useState(FALLBACK_SERVICES[0].id)
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [jam, setJam] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [wa, setWa] = useState('')
  const [terisi, setTerisi] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const service = services.find((s) => s.id === serviceId)!

  useEffect(() => {
    if (!barberId || !tanggal) return
    fetch(`/api/bookings?barber_id=${barberId}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => setTerisi(d.bookings ?? []))
      .catch(() => setTerisi([]))
  }, [barberId, tanggal])

  const slotPenuh = useMemo(() => {
    const set = new Set<string>()
    for (const slot of SLOTS) {
      const selesai = tambahMenit(slot, service.durasi_menit)
      const clash = terisi.some(
        (b) => slot < b.jam_selesai.slice(0, 5) && selesai > b.jam_mulai.slice(0, 5),
      )
      if (clash) set.add(slot)
    }
    return set
  }, [terisi, service])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!jam) return setErr('Pilih jam dulu ya.')
    if (!nama.trim() || !wa.trim()) return setErr('Isi nama & nomor WA.')
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: barberId,
          service_id: serviceId,
          tanggal,
          jam_mulai: jam,
          nama_pelanggan: nama,
          wa,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal booking')
      router.push(`/sukses?id=${data.booking?.id ?? ''}&nama=${encodeURIComponent(nama)}&tanggal=${tanggal}&jam=${jam}`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold">Form Booking</h1>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm text-neutral-400">Kapster</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBarberId(b.id); setJam(null) }}
                  className={`rounded-lg border px-3 py-2 ${barberId === b.id ? 'border-amber-400 bg-amber-400/10' : 'border-neutral-700'}`}
                >
                  {b.nama}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-400">Layanan</label>
            <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setJam(null) }} className="mt-2 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.nama} — {rupiah(s.harga)} ({s.durasi_menit} mnt)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-neutral-400">Tanggal</label>
            <input type="date" value={tanggal} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setTanggal(e.target.value); setJam(null) }} className="mt-2 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2" />
          </div>

          <div>
            <label className="text-sm text-neutral-400">Jam (09:00–21:00, durasi {service.durasi_menit} mnt)</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {SLOTS.map((slot) => {
                const penuh = slotPenuh.has(slot)
                const aktif = jam === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={penuh}
                    onClick={() => setJam(slot)}
                    title={penuh ? 'Sudah dibooking' : `Pilih ${slot}`}
                    className={`rounded-lg border px-2 py-2 text-sm ${
                      penuh ? 'border-neutral-800 bg-neutral-900 text-neutral-600 line-through' : aktif ? 'border-amber-400 bg-amber-400/10' : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-500">Slot coret = sudah dibooking (anti double-booking per kapster).</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu" className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2" />
            <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="No. WA (08...)" className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2" />
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}

          <button disabled={loading} className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-black disabled:opacity-50">
            {loading ? 'Menyimpan...' : `Booking ${service.nama} ${jam ? `• ${jam}` : ''}`}
          </button>
        </form>
      </div>
    </main>
  )
}
