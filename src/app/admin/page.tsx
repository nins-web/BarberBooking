'use client'

import { useEffect, useState } from 'react'

type Row = {
  id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  nama_pelanggan: string
  wa: string
  status: string
  barbers: { nama: string } | null
  services: { nama: string; harga: number } | null
}

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  async function load(t: string) {
    setLoading(true)
    try {
      const r = await fetch(`/api/bookings?tanggal=${t}`)
      const d = await r.json()
      setRows(d.bookings ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tanggal) }, [tanggal])

  async function setStatus(id: string, status: string) {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load(tanggal)
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Admin — Booking Hari Ini</h1>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-4 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2" />
        {loading ? (
          <p className="mt-6 text-neutral-400">Memuat...</p>
        ) : rows.length === 0 ? (
          <p className="mt-6 text-neutral-400">Belum ada booking tanggal {tanggal}.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.jam_mulai.slice(0, 5)}–{r.jam_selesai.slice(0, 5)} • {r.nama_pelanggan}</p>
                  <p className="text-sm text-neutral-400">{r.services?.nama} • {r.barbers?.nama} • {r.wa} • <span className="text-amber-300">{r.status}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStatus(r.id, 'confirmed')} className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-semibold text-black">Konfirmasi</button>
                  <button onClick={() => setStatus(r.id, 'batal')} className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-400">Batal</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
