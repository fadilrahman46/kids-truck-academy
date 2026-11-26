# Laporan Implementasi & Review — Sprint P2 (Replayability & Kurikulum Edukatif)

**Aplikasi:** Kota Kendaraan Ceria 3D  
**Target Pengguna:** Anak Usia 2–6 Tahun (`Balita 2–3` & `Prasekolah 4–6`)  
**Stack:** Three.js (WebGL), React, TypeScript, Tailwind CSS v4, Vite PWA  
**Cakupan:** P2-1, P2-2, P2-3 (berdasarkan `RECOMMENDATIONS_PRIORITY.md`)

---

## Ringkasan Eksekutif

Seluruh 3 item prioritas **P2** telah selesai diimplementasikan, ditinjau secara menyeluruh (code review & verifikasi otomatis), dan lolos kompilasi produksi maupun pengecekan tipe TypeScript tanpa error.

| ID | Item | Status | Hasil Review Otomatis |
| :---: | :--- | :---: | :--- |
| **P2-1** | Tata Letak Pipa Acak & 3 Template Jalur (`Truk Tangki`) | **SELESAI** | **PASS** — 90 simulasi acak (60 Prasekolah + 30 Balita): 100% dapat diselesaikan BFS, 0% auto-solved, ≥ 2 pipa teracak, emisi HUD `FILLING` = 20 |
| **P2-2** | 3 Cetak Biru Struktur 3D (`Truk Molen`: Rumah, Menara, Jembatan) | **SELESAI** | **PASS** — Ketiga struktur membangun blok demi blok dalam warna campuran & mengumumkan nama dwibahasa hingga `DONE` |
| **P2-3** | Perluasan Kurikulum Prasekolah: Angka 1–10 & Alfabet Penuh A–Z | **SELESAI** | **PASS** — 10 angka (`1–10`), 26 huruf unik (`A–Z`) + 26 piktogram SVG, penataan 10 muatan 3D dua lapis bebas clipping (`noClip: true`) |

---

## Detail Implementasi & Hasil Review

### 1. P2-1 — Tata Letak Pipa Acak untuk `Truk Tangki`
- **Modul Terdampak:** `src/three/missionScenes.ts`, `src/types/game.ts`
- **Perubahan:**
  - Mendefinisikan **3 template jalur pipa 2×3** yang berbeda untuk mode **Prasekolah**:
    1. *Template 0 (Z-Step Tengah):* `(0,0) → (0,1) → (1,1) → (1,2)`
    2. *Template 1 (Turun Awal Kiri):* `(0,0) → (1,0) → (1,1) → (1,2)`
    3. *Template 2 (Turun Kanan Penuh):* `(0,0) → (0,1) → (0,2) → (1,2)`
  - Menambahkan generator acak `generateRandomizedPipeSpecs()` dan verifier BFS `checkPipePathSolved()` untuk mode **Balita (1×3)** dan **Prasekolah (2×3)** dengan jaminan minimal 2 ubin jalur utama berada dalam posisi belum selaras sehingga teka-teki tidak pernah langsung selesai saat dimuat.
- **Hasil Review:**
  - 60 uji acak Prasekolah memunculkan seluruh 3 template `[0, 1, 2]`, tidak ada satu pun yang auto-solved, semua memiliki ≥ 2 ubin teracak, dan 100% terverifikasi solvable oleh algoritma BFS.
  - Uji misi penuh `Truk Tangki` berjalan dari `PUZZLE → FILLING → DRIVE → DONE` dengan jumlah emisi HUD `FILLING` tetap ter-throttle di **20** (mempertahankan standar P0-1).

### 2. P2-2 — 3 Cetak Biru Bangunan 3D untuk `Truk Molen`
- **Modul Terdampak:** `src/types/game.ts`, `src/three/missionScenes.ts`, `src/components/BottomDock.tsx`, `src/components/Pictograms.tsx`
- **Perubahan:**
  - Menambahkan katalog cetak biru `MOLEN_BLUEPRINTS`: **Rumah (*House*)**, **Menara (*Tower*)**, dan **Jembatan (*Bridge*)** dengan susunan geometri 3D berbeda (4 blok untuk Rumah & Menara, 5 blok termasuk dua pagar jembatan untuk Jembatan).
  - Cetak biru bergiliran otomatis tiap ronde baru dan pemain juga dapat memilih struktur secara langsung melalui tombol berpiktogram (`BlueprintPictogram`) pada fase `PICK` lengkap dengan pelafalan dwibahasa saat dipilih maupun saat selesai dibangun.
  - Pembersihan (disposal) geometri & material 3D lama dijalankan otomatis saat pemain mengganti cetak biru agar tidak terjadi kebocoran memori GPU.
- **Hasil Review:**
  - Pengujian menyeluruh ketiga cetak biru dengan campuran warna Merah + Kuning → Oranye berjalan mulus hingga `phase: "DONE"` dan memicu perayaan bintang serta prompt dwibahasa yang tepat (`"Rumah warna Oranye selesai!"`, `"Menara warna Oranye selesai!"`, `"Jembatan warna Oranye selesai!"`).

### 3. P2-3 — Kurikulum Prasekolah Angka 1–10 & Alfabet Penuh A–Z
- **Modul Terdampak:** `src/types/game.ts`, `src/three/missionScenes.ts`, `src/components/Pictograms.tsx`
- **Perubahan:**
  - Memperluas `NUMBER_WORDS` dari `1–6` menjadi **`1–10`** dwibahasa Indonesia–Inggris (*Satu/One* hingga *Sepuluh/Ten*).
  - Melengkapi `LETTERS_PRESCHOOL` menjadi **26 huruf penuh (`A–Z`)** dengan kata contoh ramah anak dwibahasa, serta melengkapi `LetterPictogram` dengan 8 ilustrasi SVG baru (`J, N, Q, V, W, X, Y, Z`) sehingga seluruh 26 kartu huruf memiliki ikon visual tersendiri.
  - Meningkatkan kapasitas `Truk Angkut` Prasekolah hingga **10 muatan** dengan tata letak **2 lapis piramida** (6 item lapis bawah `y = 0.05` + 4 item lapis atas `y = 0.52`) di dalam batas bak truk, serta menyesuaikan animasi pantulan fase `COUNT` berbasis `baseY` tiap item agar lapis atas tidak menembus lapis bawah.
  - Memperluas rentang hitung `Truk Crane` Prasekolah ke **4–10 peti** dengan tata letak grid dinamis (4 kolom per baris untuk > 6 peti, ukuran peti disesuaikan ke `0.64`) agar semua peti terlihat jelas tanpa saling tumpang tindih.
- **Hasil Review:**
  - Validasi data mengonfirmasi 10/10 kosakata angka dan 26/26 huruf `A–Z` unik tersedia lengkap.
  - Validasi geometri 3D 10 item di `Truk Angkut` mengonfirmasi seluruh koordinat berada di dalam interior bak (`|x| ≤ 0.65`, `|z| ≤ 0.40`) dan jarak antar-item ≥ `0.46` (`noClip: true`).
  - Misi `Truk Angkut` (10 muatan) dan `Truk Crane` (target 4–10 peti) berjalan hingga selesai tanpa kesalahan.

---

## Ringkasan Verifikasi Build & Kualitas Kode

| Pemeriksaan | Perintah / Alat | Hasil |
| :--- | :--- | :---: |
| Uji Fungsional Otomatis P2-1, P2-2, P2-3 + Regresi P0-1 | `npx tsx` headless Three.js suite | **3/3 PASS** (0 gagal) |
| Type-check & Static Analysis | `tsc --noEmit` (`lint_applet`) | **PASS** (0 error) |
| Production Bundle & PWA Service Worker | `vite build` (`compile_applet`) | **PASS** (berhasil) |

---

## Status Roadmap Keseluruhan

- **P0 (Stabilitas Inti):** 3/3 Selesai & Terverifikasi (`P0-1`, `P0-2`, `P0-3`)
- **P1 (Usabilitas Balita & Sentuh):** 4/4 Selesai & Terverifikasi (`P1-1`, `P1-2`, `P1-3`, `P1-4`)
- **P2 (Replayability & Kurikulum):** 3/3 Selesai & Terverifikasi (`P2-1`, `P2-2`, `P2-3`)
- **P3 (Motivasi & Alur Lanjutan):** Tersisa 2 item (`P3-1` Buku Stiker/Trofi, `P3-2` Tombol Truk Berikutnya)
