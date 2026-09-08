import Link from 'next/link'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, hasSupabaseEnv, rupiah, supabase } from '@/lib/supabase'

const WA_ADMIN = '6281289538855'

export default async function Home() {
  let barbers = FALLBACK_BARBERS
  let services = FALLBACK_SERVICES
  if (hasSupabaseEnv) {
    const [b, s] = await Promise.all([
      supabase.from('barbers').select('*').order('nama'),
      supabase.from('services').select('*').order('harga'),
    ])
    if (b.data?.length) barbers = b.data
    if (s.data?.length) services = s.data
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold">Barbershop Booking</h1>
          <p className="mt-2 text-neutral-400">Pilih layanan & kapster favoritmu, booking tanpa antre.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/booking" className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-black hover:bg-amber-300">
              Booking Sekarang
            </Link>
            <a
              href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent('Halo, mau tanya booking barbershop')}`}
              target="_blank"
              className="rounded-lg border border-neutral-700 px-5 py-2.5 hover:bg-neutral-900"
            >
              Chat Admin
            </a>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Layanan</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="font-semibold">{s.nama}</p>
                <p className="mt-1 text-amber-300">{rupiah(s.harga)}</p>
                <p className="text-sm text-neutral-400">{s.durasi_menit} menit</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Kapster</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {barbers
              .filter((b) => b.aktif)
              .map((b) => (
                <div key={b.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-700 text-xl font-bold">
                    {b.nama.charAt(0)}
                  </div>
                  <p className="mt-2 font-semibold">{b.nama}</p>
                  <p className="text-xs text-green-400">Tersedia</p>
                </div>
              ))}
          </div>
        </section>

        <footer className="mt-10 text-center text-sm text-neutral-500">
          Jam operasional 09.00–21.00 • WA admin{' '}
          <a className="underline" href={`https://wa.me/${WA_ADMIN}`}>
            {WA_ADMIN}
          </a>
        </footer>
      </div>
    </main>
  )
}
