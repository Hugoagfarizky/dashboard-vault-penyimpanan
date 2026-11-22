# Vaultly — Dashboard Vault Penyimpanan

Dashboard penyimpanan pribadi untuk mengatur file, catatan, dan tautan dalam browser. Aplikasi ini dibuat dengan React + TypeScript dan dapat dideploy sebagai situs statis ke GitHub Pages.

## Fitur

- Folder dan subfolder untuk mengorganisasi konten.
- Unggah file, buat catatan, dan simpan tautan dengan tag.
- Pencarian global serta filter berdasarkan tipe dan tag.
- Pratinjau gambar, PDF, dan file teks; semua file dapat diunduh.
- Data tersimpan di IndexedDB pada browser pengguna.
- Ekspor vault ke ZIP dan impor dengan resolusi konflik item.
- Antarmuka Bahasa Indonesia dan Inggris yang responsif.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Untuk membuat hasil produksi:

```bash
npm run build
```

## Penyimpanan data

Vaultly tidak menggunakan backend maupun akun. File, metadata, dan pengaturan bahasa disimpan di browser pada perangkat ini. Menghapus data situs browser akan menghapus vault, jadi gunakan menu **Ekspor** secara berkala untuk menyimpan cadangan ZIP.

## Deploy GitHub Pages

Workflow [deploy.yml](.github/workflows/deploy.yml) menjalankan build lalu menerbitkan folder `dist` setiap ada push ke branch `main`. Di pengaturan repository GitHub, pilih **GitHub Actions** sebagai sumber Pages bila belum aktif.

## Proyek terbuka

- [Lisensi MIT](LICENSE)
- [Panduan kontribusi](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Kebijakan privasi](PRIVACY.md)
