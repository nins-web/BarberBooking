'use client'

import { useEffect, useState } from 'react'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, hasSupabaseEnv, rupiah, supabase } from '@/lib/supabase'

type Barber = { id: string; nama: string }
type Service = { id: string; nama: string; harga: number }

const KOMISI = 20000

export default function KasirPage() {
  const [barbers, setBarbers] = useState<Barber[]>(FALLBACK_BARBERS)
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES)
  const [barberId, setBarberId] = useState(FALLBACK_BARBERS[0].id)
  const [serviceId, setServiceId] = useState(FALLBACK_SERVICES[0].id)
  const [metode, setMetode] = useState('Tunai')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    if (!hasSupabaseEnv) return
    ;(async () => {
      const { data: b } = await supabase.from('barbers').select('id,nama').eq('aktif', true).order('nama')
      if (b?.length) {
        setBarbers(b as Barber[])
        setBarberId((prev) => (b as Barber[]).some((x) => x.id === prev) ? prev : (b as Barber[])[0].id)
      }
      const { data: s } = await supabase.from('services').select('id,nama,harga').order('nama')
      if (s?.length) {
        setServices(s as Service[])
        setServiceId((prev) => (s as Service[]).some((x) => x.id === prev) ? prev : (s as Service[])[0].id)
      }
    })()
  }, [])

  const service = services.find((s) => s.id === serviceId)
  const total = service?.harga ?? 0

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setOk('')
    if (!barberId || !serviceId) return setErr('Pilih kapster dan layanan dulu.')
    setLoading(true)
    try {
      const res = await fetch('/api/kasir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barber_id: barberId, service_id: serviceId, metode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi')
      setOk(`Tersimpan: ${service?.nama} ${rupiah(total)} (${metode}), komisi ${rupiah(KOMISI)}.`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan transaksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold">Kasir</h1>
        <p className="mt-1 text-sm text-neutral-400">Catat pembayaran pelanggan. Komisi kapster {rupiah(KOMISI)}/transaksi.</p>
        <form onSubmit={simpan} className="mt-6 space-y-5">
          <div>
            <label className="text-sm text-neutral-400">Kapster</label>
            <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="mt-2 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2">
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Layanan</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mt-2 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.nama} — {rupiah(s.harga)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Metode Bayar</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['Tunai', 'QRIS'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetode(m)}
                  className={`rounded-lg border px-3 py-2 font-semibold ${metode === m ? 'border-amber-400 bg-amber-400/10' : 'border-neutral-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
            <div className="flex justify-between"><span className="text-neutral-400">Total</span><span className="font-bold">{rupiah(total)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-neutral-400">Komisi kapster</span><span>{rupiah(KOMISI)}</span></div>
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          {ok && <p className="text-sm text-green-400">{ok}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-black disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </main>
  )
}
