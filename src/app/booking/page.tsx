'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, rupiah } from '@/lib/supabase'

const SLOTS = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)
const STEPS = ['Kapster', 'Layanan', 'Jadwal', 'Data Diri'] as const

type BookingRow = { jam_mulai: string; jam_selesai: string; status: string }

function tambahMenit(jam: string, menit: number) {
  const [h, m] = jam.split(':').map(Number)
  const t = h * 60 + m + menit
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

function formatTanggal(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = sessionStorage.getItem('booking:' + key)
    return v !== null ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem('booking:' + key, JSON.stringify(value))
  } catch {
    /* abaikan */
  }
}

export default function BookingPage() {
  const router = useRouter()
  const [barbers] = useState(FALLBACK_BARBERS)
  const [services] = useState(FALLBACK_SERVICES)
  const [step, setStep] = useState(() => load('step', 0))
  const [barberId, setBarberId] = useState<string>(() => load('barberId', FALLBACK_BARBERS[0].id))
  const [serviceId, setServiceId] = useState<string>(() => load('serviceId', FALLBACK_SERVICES[0].id))
  const [tanggal, setTanggal] = useState(() => load('tanggal', new Date().toISOString().slice(0, 10)))
  const [jam, setJam] = useState<string | null>(() => load<string | null>('jam', null))
  const [nama, setNama] = useState(() => load('nama', ''))
  const [wa, setWa] = useState(() => load('wa', ''))
  const [terisi, setTerisi] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    save('step', step)
    save('barberId', barberId)
    save('serviceId', serviceId)
    save('tanggal', tanggal)
    save('jam', jam)
    save('nama', nama)
    save('wa', wa)
  }, [step, barberId, serviceId, tanggal, jam, nama, wa])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const barberParam = q.get('barber')
    if (barberParam && barbers.some((b) => b.id === barberParam)) {
      setBarberId(barberParam)
      setJam(null)
    }
    const serviceParam = q.get('service')
    if (serviceParam && services.some((s) => s.id === serviceParam)) {
      setServiceId(serviceParam)
      setJam(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const service = services.find((s) => s.id === serviceId)!
  const barber = barbers.find((b) => b.id === barberId)!

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
        <Link href="/" className="block text-center" aria-label="Kembali ke beranda">
          <p className="text-xs font-bold tracking-[0.3em] text-amber-400">‹ BRO BARBERSHOP</p>
          <h1 className="mt-1 text-2xl font-black">Booking Tempat Duduk</h1>
        </Link>

        <ol className="mt-6 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1 last:flex-none">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  i < step ? 'bg-amber-400 text-black' : i === step ? 'bg-amber-400 text-black ring-2 ring-amber-200' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              <span className={`hidden text-xs sm:block ${i === step ? 'font-semibold text-white' : 'text-neutral-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-amber-400' : 'bg-neutral-800'}`} />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section className="mt-6">
            <h2 className="font-semibold">Pilih kapstermu</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBarberId(b.id); setJam(null) }}
                  className={`rounded-xl border p-4 text-center transition-colors ${
                    barberId === b.id ? 'border-amber-400 bg-amber-400/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-2xl font-black text-black">
                    {b.nama.charAt(0)}
                  </div>
                  <p className="mt-2 font-semibold">{b.nama}</p>
                  <p className="text-xs text-green-400">● Tersedia hari ini</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-5 w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-black hover:bg-amber-300">
              Lanjut: Pilih Layanan →
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="mt-6">
            <h2 className="font-semibold">Pilih layanan <span className="font-normal text-neutral-500">— dengan {barber.nama}</span></h2>
            <div className="mt-3 space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setServiceId(s.id); setJam(null) }}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                    serviceId === s.id ? 'border-amber-400 bg-amber-400/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{s.nama}</span>
                    <span className="text-sm text-neutral-400">{s.durasi_menit} menit</span>
                  </span>
                  <span className="text-lg font-bold text-amber-300">{rupiah(s.harga)}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setStep(0)} className="rounded-lg border border-neutral-700 px-5 py-2.5 hover:bg-neutral-800">← Kembali</button>
              <button onClick={() => setStep(2)} className="flex-1 rounded-lg bg-amber-400 py-2.5 font-semibold text-black hover:bg-amber-300">
                Lanjut: Pilih Jadwal →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-6">
            <h2 className="font-semibold">Pilih tanggal & jam</h2>
            <p className="mt-1 text-sm text-neutral-400">{service.nama} • {service.durasi_menit} menit • dengan {barber.nama}</p>
            <input
              type="date"
              value={tanggal}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setTanggal(e.target.value); setJam(null) }}
              className="mt-3 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5"
            />
            <p className="mt-3 text-sm text-neutral-400">{formatTanggal(tanggal)} — slot coret = penuh</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {SLOTS.map((slot) => {
                const penuh = slotPenuh.has(slot)
                const aktif = jam === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={penuh}
                    onClick={() => { setJam(slot); setErr('') }}
                    className={`rounded-lg border px-2 py-2.5 text-sm font-semibold ${
                      penuh ? 'border-neutral-800 bg-neutral-900 text-neutral-600 line-through' : aktif ? 'border-amber-400 bg-amber-400 text-black' : 'border-neutral-700 hover:border-amber-400/60'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setStep(1)} className="rounded-lg border border-neutral-700 px-5 py-2.5 hover:bg-neutral-800">← Kembali</button>
              <button onClick={() => jam ? (setErr(''), setStep(3)) : setErr('Pilih jam dulu ya.')} className="flex-1 rounded-lg bg-amber-400 py-2.5 font-semibold text-black hover:bg-amber-300">
                Lanjut: Isi Data →
              </button>
            </div>
            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          </section>
        )}

        {step === 3 && (
          <section className="mt-6">
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-300">RINGKASAN BOOKING</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-neutral-400">Kapster</dt><dd className="font-semibold">{barber.nama}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-400">Layanan</dt><dd className="font-semibold">{service.nama}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-400">Waktu</dt><dd className="font-semibold">{formatTanggal(tanggal)}, {jam}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-400">Total bayar di tempat</dt><dd className="font-bold text-amber-300">{rupiah(service.harga)}</dd></div>
              </dl>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-neutral-400">Nama kamu</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Rizky" className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5" />
              </div>
              <div>
                <label className="text-sm text-neutral-400">No. WA aktif</label>
                <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="cth: 0812..." inputMode="tel" className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5" />
              </div>
              {err && <p className="text-sm text-red-400">{err}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-neutral-700 px-5 py-2.5 hover:bg-neutral-800">← Kembali</button>
                <button disabled={loading} className="flex-1 rounded-lg bg-amber-400 py-2.5 font-semibold text-black disabled:opacity-50 hover:bg-amber-300">
                  {loading ? 'Menyimpan...' : 'Konfirmasi Booking'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
