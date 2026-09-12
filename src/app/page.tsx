import Link from 'next/link'
import HomeTabs from './Tabs'
import { FALLBACK_BARBERS, FALLBACK_SERVICES, hasSupabaseEnv, supabase } from '@/lib/supabase'

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
  // Anti-double: 1 nama = 1 baris (DB boleh kotor, tampil tetap bersih)
  const seen = new Set<string>()
  barbers = barbers.filter((x) => {
    const k = (x.nama ?? '').trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

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

        <HomeTabs barbers={barbers} services={services} mapsUrl={MAPS_URL} waBarber={WA_BARBER} telpDisplay={TELP_DISPLAY} />

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
