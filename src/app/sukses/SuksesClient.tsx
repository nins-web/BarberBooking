'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const WA_ADMIN = '6288991304944'

export default function SuksesClient() {
  const q = useSearchParams()
  const nama = q.get('nama') ?? ''
  const tanggal = q.get('tanggal') ?? ''
  const jam = q.get('jam') ?? ''
  const msg = encodeURIComponent(`Halo, saya ${nama} sudah booking tanggal ${tanggal} jam ${jam}. Mohon konfirmasi.`)
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl">✓</div>
        <h1 className="mt-4 text-2xl font-bold">Booking Berhasil!</h1>
        <p className="mt-2 text-neutral-400">
          {nama && <>Terima kasih, <b className="text-neutral-200">{nama}</b>. </>}
          {tanggal && jam && <>Jadwalmu <b className="text-neutral-200">{tanggal} jam {jam}</b>. Tunjukkan halaman ini saat datang.</>}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a href={`https://wa.me/${WA_ADMIN}?text=${msg}`} target="_blank" className="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-black">
            Konfirmasi via WA Admin
          </a>
          <Link href="/booking" className="rounded-lg border border-neutral-700 px-5 py-2.5">Booking Lagi</Link>
          <Link href="/" className="text-sm text-neutral-500 underline">Kembali ke beranda</Link>
        </div>
      </div>
    </main>
  )
}
