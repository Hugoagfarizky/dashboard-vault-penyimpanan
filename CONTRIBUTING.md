# Contributing to Vaultly

Terima kasih ingin berkontribusi. Kontribusi berupa perbaikan bug, peningkatan aksesibilitas, dokumentasi, dan fitur kecil sangat diterima.

## Sebelum mulai

1. Baca [Code of Conduct](CODE_OF_CONDUCT.md).
2. Periksa issue dan pull request terbuka untuk menghindari pekerjaan ganda.
3. Buat issue terlebih dahulu untuk perubahan yang mengubah perilaku atau antarmuka secara besar.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Sebelum membuka pull request, pastikan build produksi berhasil:

```bash
npm run build
```

## Pull request

- Buat branch dengan nama yang menjelaskan perubahan, misalnya `fix/import-validation`.
- Jaga perubahan tetap terfokus dan sertakan pembaruan dokumentasi bila perilaku pengguna berubah.
- Jelaskan masalah, solusi, dan cara memverifikasi perubahan dalam deskripsi pull request.
- Jangan menyertakan data vault pribadi, file sensitif, atau kredensial dalam commit.

Dengan mengirimkan kontribusi, Anda menyetujui bahwa kontribusi tersebut dilisensikan di bawah [MIT License](LICENSE).
