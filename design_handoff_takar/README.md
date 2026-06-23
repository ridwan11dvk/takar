# Handoff: Takar — Inventory & HPP Tracker (3 Layar Inti)

## Overview
**Takar** adalah web app *inventory & HPP tracker* untuk UMKM F&B kecil (coffee shop rumahan, booth minuman). Dipakai owner dari **HP** (utama) & **tablet**. Fokus: pantau stok + tahu untung asli per menu. Brand contoh: **Latteva**.

Handoff ini mencakup **3 layar inti** + design system mini (tokens & komponen reusable) untuk dipakai ulang di semua halaman lain.

> **Aturan bahasa:** semua teks yang dilihat user **Bahasa Indonesia**. Nama field internal (`currentStock`, `sellingPrice`, dst.) jangan pernah ditampilkan — pakai label Indonesia.

## About the Design Files
File `.dc.html` di bundle ini adalah **design reference** — prototipe HTML yang menunjukkan tampilan & perilaku yang diinginkan, **bukan kode produksi untuk disalin langsung**. Tugasnya: **recreate desain ini di environment codebase tujuan** (mis. React + Tailwind, Next.js, Vue, dsb.) memakai pattern & library yang sudah ada di sana. Kalau belum ada environment, pilih framework yang paling cocok (rekomendasi: **React + TypeScript + Tailwind**, karena tokens di bawah memetakan rapi ke Tailwind theme).

## Fidelity
**High-fidelity (hifi).** Warna, tipografi, spacing, radius, dan layout sudah final. Recreate UI se-pixel-perfect mungkin memakai library codebase. Ikon memakai gaya **Lucide** (outline) — pakai paket `lucide-react` atau setara.

---

## Design Tokens

### Warna
| Token | Hex | Pakai untuk |
|---|---|---|
| `primary` | `#C75C3C` | Terracotta hangat — tombol utama, aksen aktif, angka penting sekunder |
| `primary-strong` (shadow) | `rgba(199,92,60,.3)` | Shadow tombol primary |
| `bg` | `#FAF6F0` | Background app (off-white hangat) |
| `surface` | `#FFFFFF` | Card |
| `surface-alt` | `#F3ECE3` | Fill stepper, tombol restock sekunder |
| `text` | `#2A2521` | Teks utama (warm near-black) |
| `text-secondary` | `#7A7066` | Label sekunder |
| `text-muted` | `#9A8F82` / `#A89E94` | Caption, placeholder, ikon nav non-aktif |
| `border` | `#EFE7DD` | Garis & border card |
| `border-dashed` | `#E4DACE` | Pembatas total di keranjang |

### Warna Status (WAJIB konsisten di seluruh app)
| Status | Teks/ikon | Background pill | Dot |
|---|---|---|---|
| 🟢 **Aman** | `#15803D` | `#E6F4EA` | `#15803D` |
| 🟡 **Menipis** | `#B45309` | `#FCEFD6` | `#D97706` |
| 🔴 **Habis / Minus** | `#DC2626` | `#FBE6E6` | `#DC2626` |
| Banner warning (soft) | teks `#7A4D11` | bg `#FCF4DD`, border `#F0DCA0` | — |
| State positif "semua aman" | teks `#15803D` | bg `#EAF6EC`, border `#C9E7CF` | — |
| Profit / untung | `#15803D` | — | — |
| Waste / kerugian | `#DC2626` | — | — |

### Tipografi — **Plus Jakarta Sans** (Google Fonts), weight 400/500/600/700/800
| Peran | Size / weight | Catatan |
|---|---|---|
| Angka utama (uang) | 40px / 800, letter-spacing −1px | Dashboard penjualan hari ini |
| Angka stat card | 28–30px / 800 | |
| Judul halaman (top bar) | 20–22px / 800 | |
| Total keranjang | 26px / 800 | |
| Nama menu / bahan | 15–16px / 700 | |
| Body / label | 14–15px / 600 | |
| Caption sekunder | 12–13px / 500–600, warna muted | |
| Badge / tag mini | 11–13px / 700 | |

Aturan: **angka penting (uang & stok) selalu besar + tebal** karena dilihat duluan.

### Spacing — skala 4pt
`4 · 8 · 12 · 16 · 24 · 32`. Padding card umum `14–20px`, gap grid `12px`, padding layar `16px`.

### Radius
| Token | Nilai |
|---|---|
| pill / badge | `999px` |
| tombol kecil / chip | `10–14px` |
| card | `16–22px` |
| phone frame | `36px` |
| tombol primary | `16px` |

### Shadow
| Pakai | Nilai |
|---|---|
| Card lembut | `0 2px 8px rgba(70,50,35,.05)` |
| Card menonjol | `0 2px 10px rgba(70,50,35,.06)` |
| Tombol primary | `0 6px 14px rgba(199,92,60,.3)` |
| Bottom sheet keranjang | `0 -6px 18px rgba(60,40,25,.06)` |

---

## Komponen Reusable

### 1. Top Bar
Tinggi `56px`, padding `0 18px`, flex space-between, background transparan di atas `bg`. Kiri: judul (20px/800) atau logo+nama. Kanan: 1 aksi opsional (ikon ⚙ / chip "+ Tambah" / indikator "Total: Rp …").

### 2. Bottom Navigation (HP) — file `BottomNav.dc.html`
Background `#fff`, border-top `#EFE7DD`, padding `9px 6px 11px`. 5 item flex equal: **Dashboard · Penjualan · Bahan · Laporan · Lainnya**. Tiap item: ikon Lucide 23px + label 11px. Aktif = `#C75C3C` weight 700; non-aktif = `#AAA095` weight 500. Tap target ≥48px. Prop: `active` (salah satu dari 5 label). (`Lainnya` membuka: Menu, Resep, Restock, Waste, Stok Opname, Pengaturan.) Di tablet boleh jadi sidebar kiri.

### 3. Status Badge
Pill `border-radius:999px`, padding `5–6px 11–12px`, font 11–13px/700, isi: dot 6–8px + label. 3 varian warna (lihat tabel status). Varian "Minus" pakai warna merah/Habis.

### 4. Stat Card
Card putih radius 18–22px, padding 16–20px. Isi: label kecil (13px/600 muted) → angka besar (28–40px/800) → (opsional) sub-line / delta / pill profit. Contoh utama: "Penjualan hari ini → Rp 250.000" + pill hijau "Untung kotor Rp 140.000".

### 5. Primary Button (besar)
Height `54–56px`, radius `16px`, bg `#C75C3C`, teks `#fff` 16px/700, full-width, shadow primary. State disabled: bg `#E7DFD4`, teks `#B3A89B`, tanpa shadow.

### 6. Qty Stepper
Wrapper fill `#F3ECE3` radius 12–14px padding 4–6px. Tombol `−` / `+` 34–42px kotak, bg `#fff`, teks `#C75C3C` ~19–22px/700, radius 9–11px. Angka di tengah 16–19px/800. Tap target besar.

### Menu Card (Penjualan)
Card putih radius 18px padding 14px, min-height 118px, flex column. Isi: nama (15px/700) → (opsional tag "resep belum dibuat" 10px/700 amber) → harga (14px/600 muted) → tombol `+` 46px (radius 14px, bg primary, teks putih 26px) rata kanan bawah. **1 tap = +1 ke keranjang.**

---

## Screens / Views

### LAYAR 1 — Penjualan Cepat *(paling kritikal)*
**Purpose:** input penjualan secepat mungkin (1–2 tap/item) saat ramai, 1 tangan.
**Layout (HP 390px):** Top bar "Penjualan" + indikator "Total: Rp …" → grid menu 2 kolom (tablet 3–4) → keranjang (bottom sheet putih radius 22px, scrollable) → sticky bottom bar: total besar + Primary Button "Simpan Penjualan" full-width → Bottom Nav (aktif: Penjualan).
**Menu (data Latteva):** Kopi Latte 18.000 · Matcha Latte 20.000 · Es Teh 10.000 · Roti Bakar 15.000 · Spaghetti Bolognese 25.000 *(resep belum dibuat)* · Mac n Cheese 22.000.

**States:**
- **Keranjang kosong** — grid + bottom bar "Total: Rp 0", tombol simpan disabled, hint "Keranjang masih kosong · tap + pada menu".
- **Ada isi** — Kopi Latte ×2 (Rp 36.000) + Roti Bakar ×1 (Rp 15.000) = **Total Rp 51.000**. Tiap baris keranjang: nama + harga satuan · Qty Stepper · subtotal.
- **Warning stok kurang** — banner kuning lembut (`#FCF4DD`): *"Stok bahan kurang. Tetap simpan? Stok akan minus."* + sub "Matcha Latte — susu UHT tidak cukup." dengan 2 aksi: **Tetap simpan** (bg `#B45309`) / **Batal** (outline). **JANGAN blok keras** — user tetap boleh lanjut.
- **Menu tanpa resep** — kartu diberi tag "resep belum dibuat"; saat ditambah, munculkan konfirmasi ringan.

### LAYAR 2 — Dashboard
**Purpose:** sekali buka langsung tahu kondisi hari ini.
**Layout (atas→bawah):** Top bar "Takar · Latteva" + ⚙ → Stat Card utama (Penjualan hari ini Rp 250.000 + pill untung kotor Rp 140.000) → 2 stat card kecil sejajar (Terjual 18 · Waste Rp 12.000, waste merah) → kartu **"⚠ Bahan menipis (3)"** (border amber): Susu UHT 200 ml · Cup 5 pcs · Kopi arabica 80 gram, tiap baris badge Menipis & tap → restock/detail (yang 0 → badge merah "Habis") → Primary Button "+ Penjualan Cepat" (shortcut ke Layar 1) → reminder kecil "Terakhir backup 3 hari lalu — Export data" → Bottom Nav (aktif: Dashboard).

**States:**
- **Hari produktif** (seperti di atas).
- **Belum ada penjualan** — angka "Rp 0" warna muted, empty card ramah "Belum ada penjualan hari ini / Yuk mulai…" + Primary Button Penjualan Cepat.
- **Semua stok aman** — kartu bahan menipis diganti state positif hijau (`#EAF6EC`): ikon ✓ + "Semua stok aman".

### LAYAR 3 — Bahan Baku (List)
**Purpose:** lihat semua bahan + status sekilas, akses cepat restock/edit. **Pola badge di sini = acuan visual seluruh app.**
**Layout:** Top bar "Bahan Baku" + chip "+ Tambah" → search bar "🔍 Cari bahan…" → filter chip kategori (Semua · Kopi · Dairy · Kemasan · Makanan; aktif = bg primary) → list card bahan → Bottom Nav (aktif: Bahan). Tiap card: nama (16px/700) + Status Badge sebaris, stok+satuan besar (19px/800) di bawah, aksi kanan **Restock** (fill `#F3ECE3`, teks primary) + **Edit** (outline).
**Data (Latteva):** Susu UHT 820 ml 🟢 · Kopi arabica 80 gram 🟡 · Cup 5 pcs 🟡 · Es batu 0 🔴 · Gula 1.500 gram 🟢 · Macaroni 300 gram 🟡 · Sirup Vanilla −40 ml 🔴 Minus (stok merah, untuk contoh state minus).

**States:**
- **List normal** (campuran status, termasuk baris minus dengan angka stok merah).
- **Stok minus** — angka "−40 ml" warna `#DC2626`, badge merah "Minus" → owner sadar harus stok opname.
- **List kosong** — empty state: ikon box + "Belum ada bahan" + Primary Button "Tambah Bahan".
- **Search kosong** — ikon search + "Bahan tidak ditemukan" + saran tambah bahan baru.

---

## Interactions & Behavior
- Menu card tombol `+`: tap → tambah 1 item ke `cart` (jika sudah ada, qty +1). Indikator total top bar & sticky bar update realtime.
- Qty Stepper: `−` di qty 1 → hapus item dari keranjang. `+` tambah qty.
- Simpan Penjualan: disabled saat cart kosong; submit → kurangi stok bahan sesuai resep, reset cart, toast sukses.
- Tambah menu yang bahannya kurang → tampilkan banner warning (non-blocking). "Tetap simpan" lanjut & stok jadi minus; "Batal" batalkan penambahan.
- Bahan card tap baris / Restock → buka form restock; Edit → form edit bahan.
- Transisi halus (~150–200ms ease) untuk perubahan keranjang & badge. Tidak ada animasi berat.
- Responsive: HP 390px (utama) → tablet 768px (grid menu 3–4 kolom, bottom nav boleh jadi sidebar).

## State Management
- `cart: { menuId, qty }[]` — derived `total`, `itemCount`, subtotal per baris.
- `menus: { id, name, sellingPrice, hasRecipe }[]` (tampilkan `name` + harga rupiah; `hasRecipe=false` → tag "resep belum dibuat").
- `ingredients: { id, name, currentStock, unit, status }[]` — `status` ∈ aman/menipis/habis/minus, dihitung dari `currentStock` vs ambang.
- `dashboard: { todaySales, grossProfit, soldCount, wasteValue, lowStock[] }`.
- Filter/search state untuk layar bahan.
- Format rupiah: `Rp ` + ribuan titik (mis. `Rp 18.000`). Jangan tampilkan nama field internal.

## Design Tokens (ringkas untuk konfigurasi)
Semua nilai ada di tabel **Design Tokens** di atas — petakan ke theme codebase (Tailwind `theme.extend.colors`, dst.). Font: Plus Jakarta Sans. Ikon: Lucide.

## Assets
- Font **Plus Jakarta Sans** via Google Fonts.
- Ikon: gaya **Lucide** (home, shopping-bag, box, bar-chart, more-horizontal, settings, search, plus, check, alert-triangle). Pakai paket ikon codebase.
- Logo: placeholder kotak "T" terracotta (`#C75C3C`, radius 8–10px). Ganti dengan logo asli bila ada.
- Tidak ada gambar foto di desain ini.

## Screenshots
Referensi visual tiap layar & state ada di folder `screenshots/`:
- `01-penjualan-keranjang-kosong.png`
- `02-penjualan-keranjang-terisi.png`
- `03-penjualan-warning-stok.png`
- `04-dashboard-produktif.png`
- `05-dashboard-belum-ada-penjualan.png`
- `06-dashboard-semua-aman.png`
- `07-bahan-list-normal.png`
- `08-bahan-list-kosong.png`
- `09-bahan-search-kosong.png`

## Files
- `Takar.dc.html` — galeri lengkap: design tokens + komponen + 3 layar × semua state (referensi visual utama).
- `BottomNav.dc.html` — komponen Bottom Navigation reusable (prop `active`).

> Catatan teknis: file `.dc.html` adalah komponen HTML streaming dengan style inline. Ambil **nilai visual & struktur layout**-nya sebagai acuan, lalu implement ulang dengan komponen/library codebase kamu.
