'use client'

import Link from 'next/link'
import { useState } from 'react'
import { rupiah } from '@/lib/supabase'

type Barber = { id: string; nama: string; aktif: boolean }
type Service = { id: string; nama: string; harga: number; durasi_menit: number }

const TABS = [
  { id: 'layanan', label: 'Layanan' },
  { id: 'kapster', label: 'Kapster' },
  { id: 'lokasi', label: 'Lokasi' },
] as const

export default function HomeTabs({
  barbers,
  services,
  mapsUrl,
  waBarber,
  telpDisplay,
}: {
  barbers: Barber[]
  services: Service[]
  mapsUrl: string
  waBarber: string
  telpDisplay: string
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('layanan')

  return (
    <>
      <nav className="sticky top-0 z-40 -mx-4 mt-8 border-y border-neutral-800 bg-neutral-950/95 px-4 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-1 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-amber-400 text-black'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'layanan' && (
        <section className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="font-semibold">{s.nama}</p>
                <p className="mt-1 text-lg font-bold text-amber-300">{rupiah(s.harga)}</p>
                <p className="text-sm text-neutral-400">{s.durasi_menit} menit</p>
                <Link
                  href="/booking"
                  className="mt-3 rounded-lg border border-amber-400/50 px-4 py-2 text-center text-sm font-semibold text-amber-300 hover:bg-amber-400 hover:text-black"
                >
                  Pilih
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'kapster' && (
        <section className="mt-6">
          <div className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            {barbers
              .filter((b) => b.aktif)
              .map((b) => (
                <Link
                  key={b.id}
                  href={`/booking?barber=${b.id}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-neutral-800"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-black text-black">
                    {b.nama.charAt(0)}
                  </div>
                  <span className="flex-1">
                    <span className="block font-semibold">{b.nama}</span>
                    <span className="text-xs text-green-400">● Tersedia — ketuk untuk booking</span>
                  </span>
                  <span className="text-xl text-neutral-500">›</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {tab === 'lokasi' && (
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="space-y-1 text-sm text-neutral-300">
            <p>Sooko, Mojokerto, Jawa Timur</p>
            <p>Setiap hari • 09.00–22.00 WIB</p>
            <p>
              <a className="text-amber-300 underline" href={`tel:+${waBarber}`}>
                {telpDisplay}
              </a>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-800"
            >
              Buka di Google Maps
            </a>
            <Link href="/booking" className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300">
              Booking Tempat
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
