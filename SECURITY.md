# Kebijakan Keamanan

Vaultly adalah dashboard penyimpanan yang berjalan sepenuhnya di browser: tidak ada backend, tidak ada akun, dan isi vault tidak pernah diunggah. Data disimpan di IndexedDB dan dapat diekspor atau diimpor sebagai ZIP.

## Versi yang didukung

Hanya commit terbaru di `main` dan build terbaru di <https://hugoagfarizky.github.io/dashboard-vault-penyimpanan/> yang diperbaiki. Commit lama tidak dipelihara.

## Melaporkan celah

- **Jangan** membuka issue publik untuk masalah keamanan.
- Kirim email ke **nugrahaagfarizky@gmail.com** dengan subjek `[SECURITY] Vaultly`.
- Sertakan langkah reproduksi, browser dan versinya, jenis berkas yang terlibat, serta dampak yang diharapkan.

Balasan awal biasanya dalam beberapa hari. Perbaikan akan terlihat di riwayat commit, dan kamu akan disebutkan sebagai pelapor kecuali lebih memilih anonim.

## Cakupan

Karena semua pemrosesan terjadi di browser, area yang paling relevan:

- Cross-site scripting lewat catatan, tautan, nama folder, atau metadata berkas yang diimpor.
- Pratinjau berkas (gambar, PDF, teks) yang menjalankan konten aktif.
- Path traversal atau zip-slip saat impor vault ZIP, serta penanganan nama berkas yang tidak aman saat ekspor.
- Kebocoran data ke jaringan; Vaultly tidak boleh mengirim isi vault ke mana pun.
- Kerentanan dependency pada bundle produksi.

## Di luar cakupan

- Kehilangan data karena membersihkan data situs, mode incognito, atau kuota penyimpanan penuh. Gunakan menu **Ekspor** untuk cadangan.
- Masalah yang membutuhkan ekstensi browser yang sudah disusupi atau akses fisik ke perangkat.
- Denial of service terhadap server, karena tidak ada server.
