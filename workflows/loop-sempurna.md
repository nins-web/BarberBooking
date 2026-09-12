# Loop "Ronde Sempurna" — barber-booking

Aturan main iterasi UI/UX sampai pengguna bilang sempurna.

## Peran

- **Pengguna = juri.** Kritik/saran + verdict tiap ronde: `revisi` / `acc`.
- **Developer (agen) = eksekutor.** Terima kritik → kerjakan lokal → preview
  screenshot → tunggu verdict. **Dilarang deploy tanpa acc eksplisit.**

## Satu ronde

1. Pengguna kirim kritik/saran untuk **1 topik** (tidak campur topik).
2. Developer boleh tambah diagnosa + usulan proaktif, lalu eksekusi lokal.
3. Developer kirim **preview screenshot** (WAJIB lokal dulu, tanpa deploy).
4. Pengguna verdict:
   - `revisi` + catatan → kembali ke langkah 2.
   - `acc` → developer deploy + verifikasi live, ronde ditutup.

## Prinsip

- Push right: kerja maksimal dulu, ganggu pengguna sekali per ronde
  dalam bentuk preview siap nilai (bukan mentahan/log).
- Brief: tiap preview disertai ringkasan 3–5 baris (apa yang berubah,
  apa yang perlu dinilai), bukan dump teknis.
- Selesai = `acc` per bagian. Tidak ada "sempurna" implisit.

## Ronde berjalan

- Ronde 1 (landing 3 tab): ACC — live.
- Ronde 2 (booking wizard 4 langkah): ACC — live.
- Ronde 3 (tab Kapster ringkas + klik → booking preselect): ACC — live.
- Ronde 4 (anti-double kapster): ACC — live, HTML hanya 3 nama.
- Ronde 5 (anti-reset refresh + header home): ACC — live.
