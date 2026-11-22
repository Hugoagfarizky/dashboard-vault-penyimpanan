# Product Requirements Document — Vaultly

## Ringkasan

Vaultly adalah dashboard penyimpanan pribadi berbasis browser untuk mengelola file, catatan, dan tautan pada satu tempat. Versi pertama berjalan sebagai aplikasi statis tanpa akun dan menyimpan seluruh data di perangkat pengguna melalui IndexedDB. Tampilan mengutamakan pola dashboard yang bersih: sidebar folder, breadcrumb, kartu folder, dan daftar item.

## Sasaran

- Memungkinkan satu pengguna menyimpan, menemukan, melihat, dan mengorganisasi file, catatan, serta tautan dengan cepat.
- Menjaga data tetap lokal dan memberi pengguna kendali cadangan lewat ekspor dan impor.
- Menyediakan antarmuka Bahasa Indonesia dan Inggris yang responsif untuk desktop maupun layar sempit.

## Pengguna dan batasan

Pengguna awal adalah individu tanpa akun maupun kolaborasi. Aplikasi tidak memiliki backend, sinkronisasi lintas perangkat, autentikasi, atau penyimpanan di GitHub. Data hanya tersedia pada browser tempat data dibuat, sampai pengguna mengekspornya.

## Fitur rilis pertama

### Organisasi

- Membuat folder dan subfolder, mengganti nama, dan menghapus folder kosong.
- Breadcrumb dan pohon folder untuk berpindah lokasi.
- Tag pada setiap file, catatan, atau tautan.
- Pencarian berdasarkan judul, isi catatan, URL, dan tag; filter berdasarkan jenis item dan tag.

### Item vault

- Unggah file dengan nama, folder, dan tag.
- Buat serta ubah catatan teks dan tautan.
- Tampilkan daftar item beserta jenis, tag, ukuran, dan waktu perubahan.
- Pratinjau gambar, PDF, dan berkas teks; jenis lain dapat diunduh.
- Hapus item dengan konfirmasi.

### Data dan cadangan

- Simpan metadata dan blob file di IndexedDB.
- Tampilkan estimasi pemakaian penyimpanan browser jika tersedia.
- Ekspor seluruh vault ke berkas ZIP berisi `manifest.json` dan konten file.
- Impor ZIP tervalidasi. Item tanpa konflik langsung digabungkan. Untuk konflik ID, pengguna memilih mempertahankan versi lokal, menggunakan versi cadangan, atau menyimpan keduanya.

## Pengalaman pengguna

Layar utama menampilkan sidebar yang dapat diciutkan, header dengan pencarian dan aksi tambah, area folder, lalu daftar item. Aksi tambah membuka pilihan file, catatan, tautan, atau folder. Modal pratinjau menjaga konteks daftar tetap terlihat. Saat vault kosong, aplikasi memberi ajakan jelas untuk memulai.

## Model data

- `Folder`: `id`, `name`, `parentId`, `createdAt`, `updatedAt`.
- `VaultItem`: `id`, `type` (`file`, `note`, `link`), `title`, `folderId`, `tags`, `createdAt`, `updatedAt`, dan metadata sesuai jenis.
- File menyimpan `Blob`, nama MIME asli, dan ukuran. Catatan menyimpan isi teks. Tautan menyimpan URL dan deskripsi opsional.
- Cadangan menyertakan `formatVersion` untuk validasi kompatibilitas saat impor.

## Kriteria penerimaan

1. Item dan folder tetap tersedia setelah halaman dimuat ulang pada browser yang sama.
2. Pencarian, folder, tipe item, dan tag membatasi daftar secara tepat.
3. Gambar, PDF, dan teks dapat dipratinjau; file lain dapat diunduh.
4. Ekspor dan impor memulihkan item beserta metadata dan isi file.
5. Arsip rusak atau tidak kompatibel ditolak tanpa mengubah vault.
6. Konflik impor tidak menimpa data tanpa pilihan pengguna.
7. Bahasa Indonesia dan Inggris dapat dipilih, dan aplikasi nyaman dipakai pada lebar 360 px ke atas.
8. Build produksi berhasil dan dapat dideploy ke GitHub Pages.
