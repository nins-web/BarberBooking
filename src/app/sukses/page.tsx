import { Suspense } from 'react'
import SuksesClient from './SuksesClient'

export default function SuksesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-neutral-950 text-neutral-100 p-10">Memuat...</main>}>
      <SuksesClient />
    </Suspense>
  )
}
