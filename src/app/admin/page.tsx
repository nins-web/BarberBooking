'use client'

import { useEffect, useState } from 'react'

import { rupiah } from '@/lib/supabase'

// Tanggal hari ini dalam WIB (Asia/Jakarta), format YYYY-MM-DD
function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

const ADMIN_OK_KEY = 'admin_pin_ok'

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

type Tx = {
  id: string
  harga: number
  komisi: number
  metode: string
}

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [tx, setTx] = useState<Tx[]>([])
  const [tanggal, setTanggal] = useState(todayWIB)
  const [loading, setLoading] = useState(true)
  // --- PIN gate (4 digit) ---
  const [pinOk, setPinOk] = useState(false)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ADMIN_OK_KEY) === '1') setPinOk(true)
    } catch { /* abaikan */ }
  }, [])

  function submitPin(e: React.FormEvent) {
    e.preventDefault()
    const expected = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234'
    if (pin === expected) {
      setPinOk(true)
      setPinErr('')
      try { sessionStorage.setItem(ADMIN_OK_KEY, '1') } catch { /* abaikan */ }
    } else {
      setPinErr('PIN salah. Coba lagi.')
    }
  }

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
    try {
      const r = await fetch(`/api/kasir?tanggal=${t}`)
      const d = await r.json()
      setTx(d.transaksi ?? [])
    } catch {
      setTx([])
    }
  }

  useEffect(() => { if (pinOk) load(tanggal) }, [tanggal, pinOk])

  async function setStatus(id: string, status: string) {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load(tanggal)
  }

  if (!pinOk) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-sm px-4 py-10">
          <h1 className="text-2xl font-bold">Admin — PIN</h1>
          <p className="mt-1 text-sm text-neutral-400">Masukkan PIN admin 4 digit untuk melihat data.</p>
          <form onSubmit={submitPin} className="mt-6 space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-center text-xl tracking-widest"
            />
            {pinErr && <p className="text-sm text-red-400">{pinErr}</p>}
            <button className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-black">
              Buka
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Admin — Booking Hari Ini</h1>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-4 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2" />
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="font-bold">Omzet Hari Ini (WIB)</h2>
          <p className="mt-1 text-xs text-neutral-400">QRIS masuk ke rekening owner. Harga layanan belum termasuk komisi Rp20.000/kepala — komisi dibayar owner di atas omzet.</p>
          {(() => {
            const omzetKotor = tx.reduce((a, t) => a + (t.harga || 0), 0)
            const totalKomisi = tx.reduce((a, t) => a + (t.komisi || 0), 0)
            const labaBersih = omzetKotor - totalKomisi
            const tunai = tx.filter((t) => t.metode === 'Tunai').reduce((a, t) => a + (t.harga || 0), 0)
            const qris = tx.filter((t) => t.metode === 'QRIS').reduce((a, t) => a + (t.harga || 0), 0)
            return (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-neutral-950 p-3"><p className="text-neutral-400">Omzet kotor</p><p className="font-bold">{rupiah(omzetKotor)}</p></div>
                <div className="rounded-lg bg-neutral-950 p-3"><p className="text-neutral-400">Total komisi</p><p className="font-bold">{rupiah(totalKomisi)}</p></div>
                <div className="rounded-lg bg-neutral-950 p-3"><p className="text-neutral-400">Laba bersih</p><p className="font-bold">{rupiah(labaBersih)}</p></div>
                <div className="rounded-lg bg-neutral-950 p-3"><p className="text-neutral-400">Transaksi</p><p className="font-bold">{tx.length}x</p></div>
                <div className="rounded-lg bg-neutral-950 p-3 col-span-2"><p className="text-neutral-400">Tunai / QRIS</p><p className="font-bold">{rupiah(tunai)} / {rupiah(qris)}</p></div>
              </div>
            )
          })()}
        </section>
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
