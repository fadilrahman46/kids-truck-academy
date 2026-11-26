# Error & Audit Report — Sprint 1 (P0) & Sprint 2 (P1)

**Aplikasi:** Kota Kendaraan Ceria 3D  
**Cakupan Audit:** Sprint 1 (`P0-1`, `P0-2`, `P0-3`) & Sprint 2 (`P1-1`, `P1-2`, `P1-3`, `P1-4`)  
**Status Akhir:** **5/5 Error Ditemukan & Diselesaikan (RESOLVED)**

---

## Ringkasan Temuan Audit

Review kode dan alur interaksi menyeluruh terhadap seluruh modul Sprint 1 dan Sprint 2 menemukan **5 celah fungsional/visual nyata** (1 High, 2 Medium, 2 Low-Medium). Seluruhnya telah diperbaiki dan diverifikasi sebelum melanjutkan ke Sprint 3.

| Kode | Sprint / Item | Tingkat | Modul Terdampak | Status |
| :---: | :---: | :---: | :--- | :---: |
| **ERR-01** | Sprint 2 (`P1-2`) | **HIGH** | `src/App.tsx`, `src/components/BottomDock.tsx` | **RESOLVED** |
| **ERR-02** | Sprint 1 (`P0-3`) | **MEDIUM** | `src/index.css` | **RESOLVED** |
| **ERR-03** | Sprint 2 (`P1-3`) | **MEDIUM** | `src/three/missionScenes.ts` | **RESOLVED** |
| **ERR-04** | Sprint 1 (`P0-2`) | **LOW-MED** | `src/three/GameEngine.ts` | **RESOLVED** |
| **ERR-05** | Sprint 2 (`P1-4`) | **LOW-MED** | `src/three/GameEngine.ts` | **RESOLVED** |

---

## Detail Error, Akar Masalah, dan Perbaikan

### ERR-01 — Duplikasi Keyboard Listener `Truk Crane` Menyebabkan Lompatan Ganda
- **Sprint / Item:** Sprint 2 / `P1-2` (Kontrol Crane)
- **Gejala:** Saat menekan tombol panah `ArrowLeft`/`ArrowRight` di keyboard pada fase `BALANCE` *Truk Crane*, boom crane bergeser dua kali lipat (`0.18 + 0.14 = 0.32` per tekan), mudah melampaui zona toleransi `0.22` pada mode Prasekolah. Menekan `Space`/`Enter` juga memicu aksi `CRANE_DROP` dua kali dan dapat aktif meskipun modal perayaan sedang terbuka.
- **Akar Masalah:** `window.addEventListener('keydown', ...)` untuk panah/Spasi dipasang di **dua tempat secara bersamaan**: di `src/App.tsx` (sisa implementasi awal) dan di `CraneBalanceControls` pada `src/components/BottomDock.tsx` (ditambahkan saat `P1-2`).
- **Solusi:** Menghapus duplikasi handler panah/Spasi/Enter dari `src/App.tsx` sehingga `CraneBalanceControls` menjadi satu-satunya pengendali keyboard untuk fase `BALANCE`, serta menonaktifkan listener saat modal (`CelebrationModal` / `StickerBookModal`) sedang aktif.

### ERR-02 — Pemotongan Vertikal (Clipping) Kontrol 2 Baris pada Ponsel Landscape Pendek
- **Sprint / Item:** Sprint 1 / `P0-3` (Compact Mobile-Landscape HUD)
- **Gejala:** Pada layar ponsel landscape pendek (`844×390`), aturan `.compact-dock-card` membatasi `max-height: 36vh` (~140px) dengan `overflow-y: hidden`. Saat dock misi membungkus menjadi 2 baris (mis. *Truk Molen* dengan pemilih cetak biru + cat, atau *Truk Sampah* dengan 6 item), baris tombol terbawah terpotong dan tidak bisa dijangkau.
- **Akar Masalah:** `overflow-y: hidden` pada media query `@media (max-height: 480px)` di `src/index.css`.
- **Solusi:** Mengubah ke `max-height: 38vh`, `overflow-y: auto`, dan `-webkit-overflow-scrolling: touch` sehingga seluruh kontrol tetap mudah diakses dengan sentuhan sambil mempertahankan ≥ 55% area panggung 3D terbuka.

### ERR-03 — Sorotan Hint Idle Balita Tidak Langsung Hilang pada Aksi Batas (Boundary Tap)
- **Sprint / Item:** Sprint 2 / `P1-3` (Gentle Idle Visual Hints Mode Balita)
- **Gejala:** Ketika hint idle (ring emas `hintKey`) sudah muncul setelah 8 detik di mode Balita, lalu anak mengetuk tombol batas yang tidak mengubah state (mis. menekan tombol `-` saat jumlah barang sudah `1` di *Truk Angkut*, atau mengetuk cetak biru yang sudah aktif di *Truk Molen*), `activeHintKey` ter-reset secara internal tetapi UI tidak menerima `emit()` baru sehingga ring hint emas masih tertinggal di layar.
- **Akar Masalah:** `resetIdle()` tidak memicu `emit()` ketika handler aksi melakukan early-return sebelum mencapai pemanggilan `emit()`.
- **Solusi:** Memperbarui `resetIdle(onClear?: () => void)` untuk mendeteksi `hadHint = activeHintKey !== null` dan langsung memanggil `onClear()` (`emit`) apabila hint sebelumnya aktif.

### ERR-04 — Tekstur Drum `Truk Molen` Tidak Kembali ke Warna Bawaan di Garasi 3D
- **Sprint / Item:** Sprint 1 / `P0-2` (Full Sub-Rig Reset di Garasi)
- **Gejala:** Setelah anak mencampur warna di *Truk Molen* (misalnya Biru + Kuning → Hijau atau Merah + Biru → Ungu) lalu kembali ke Garasi atau memulai misi baru, drum molen 3D tetap berwarna hijau/ungu dari ronde sebelumnya.
- **Akar Masalah:** `resetTruckRig()` di `src/three/GameEngine.ts` mereset transformasi posisi/rotasi dan material sirine/air, namun belum mengembalikan `rig.drumMaterial.map` ke tekstur garis oranye bawaan (`#F59E0B`).
- **Solusi:** Menambahkan reset `rig.drumMaterial.map = createMixerStripeTexture('#F59E0B', this.maxAnisotropy)` disertai `oldMap?.dispose()` di dalam `resetTruckRig()` agar tidak ada kebocoran tekstur WebGL dan *Truk Molen* selalu kembali bersih di Garasi maupun awal misi baru.

### ERR-05 — `OrbitControls` Tertunda Aktif Kembali Jika Api Terakhir Padam di Tengah Drag-Spray
- **Sprint / Item:** Sprint 2 / `P1-4` (Drag-to-Spray `Truk Pemadam`)
- **Gejala:** Ketika pemain menyapu jari memadamkan titik api terakhir pada fase `SPRAY`, fase langsung berpindah ke `DONE` (`supportsDragSpray()` menjadi `false`), sementara `onPointerMove` hanya melakukan `return` tanpa melepaskan `isDraggingSpray` dan mengaktifkan kembali `controls.enabled` hingga jari benar-benar diangkat.
- **Akar Masalah:** Penjagaan awal `if (!this.isDraggingSpray || !this.activeMission?.supportsDragSpray?.()) return;` di `onPointerMove` mengabaikan transisi akhir fase saat drag masih berlangsung.
- **Solusi:** Memisahkan pengecekan di `onPointerMove` agar ketika `this.isDraggingSpray` bernilai `true` namun `supportsDragSpray()` sudah `false`, `this.onPointerCancel()` langsung dipanggil untuk menonaktifkan status drag dan mengembalikan `this.controls.enabled = true` seketika.

---

## Verifikasi Perbaikan

- Seluruh 5 error diuji ulang menggunakan skrip verifikasi otomatis (termasuk pembersihan hint saat boundary tap, reset tekstur drum molen, transisi akhir drag-spray pemadam, dan konsistensi langkah tunggal crane) serta pengecekan tipe TypeScript (`tsc --noEmit`).
- Status Sprint 1 & Sprint 2 pasca-perbaikan: **100% PASS (0 error tersisa)**.
