import Link from 'next/link'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, hasSupabaseEnv, rupiah, supabase } from '@/lib/supabase'

const WA_BARBER = '6288991304944'
const TELP_DISPLAY = '0889-9130-4944'
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Bro+Barbershop+Sooko+Mojokerto'

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
          <p className="text-xs font-bold tracking-[0.3em] text-amber-400">SOOKO • MOJOKERTO</p>
          <h1 className="mt-2 text-4xl font-black">
            BRO <span className="text-amber-400">BARBERSHOP</span>
          </h1>
          <p className="mt-2 text-neutral-400">Potong rapi, harga jujur. Pilih layanan & kapster favoritmu — booking tanpa antre.</p>
          <p className="mt-3 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-sm font-semibold text-amber-300">
            Buka setiap hari • 09.00–22.00
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/booking" className="rounded-lg bg-amber-400 px-6 py-2.5 font-semibold text-black hover:bg-amber-300">
              ✂ Booking Sekarang
            </Link>
            <a
              href={`https://wa.me/${WA_BARBER}?text=${encodeURIComponent('Halo Bro Barbershop, mau tanya booking')}`}
              target="_blank"
              className="rounded-lg bg-green-500 px-6 py-2.5 font-semibold text-white hover:bg-green-400"
            >
              Chat WA
            </a>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Layanan & Harga</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
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

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Kapster</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {barbers
              .filter((b) => b.aktif)
              .map((b) => (
                <div key={b.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-xl font-bold text-black">
                    {b.nama.charAt(0)}
                  </div>
                  <p className="mt-2 font-semibold">{b.nama}</p>
                  <p className="text-xs text-green-400">● Tersedia</p>
                </div>
              ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-xl font-semibold">📍 Kunjungi Kami</h2>
          <div className="mt-2 space-y-1 text-sm text-neutral-300">
            <p>Sooko, Mojokerto, Jawa Timur</p>
            <p>🕘 Setiap hari • 09.00–22.00 WIB</p>
            <p>
              📞{' '}
              <a className="text-amber-300 underline" href={`tel:+${WA_BARBER}`}>
                {TELP_DISPLAY}
              </a>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={MAPS_URL}
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

        <footer className="mt-10 text-center text-sm text-neutral-500">
          Bro Barbershop Sooko Mojokerto • 09.00–22.00 •{' '}
          <a className="underline" href={`https://wa.me/${WA_BARBER}`}>
            WA {TELP_DISPLAY}
          </a>
        </footer>
      </div>

      <a
        href={`https://wa.me/${WA_BARBER}?text=${encodeURIComponent('Halo Bro Barbershop, mau booking')}`}
        target="_blank"
        aria-label="Chat WA Bro Barbershop"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg hover:bg-green-400"
      >
        ✆
      </a>
    </main>
  )
}
