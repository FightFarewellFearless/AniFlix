# 0.7.2-JS_2 (25-Desember-2024)

MOVIE BETA TAHAP 2.
Ini adalah update ke 2 dalam pengembangan tipe data movie, update kali ini hanya merupakan penambahan beberapa fitur kecil dan beberapa perbaikan masalah. Update ini memberikan pengalaman menggunakan aplikasi yang lebih stabil.

## Penambahan

- Menambahkan berbagai macam peringatan dan informasi terkait server dari movie.
- Menambahkan 1 server cadangan baru (lokal) untuk movie.
  > Perlu di ingat server ini tidak mendukung pemutaran melalui aplikasi dan akan menggunakan WebView untuk memutar video melalui server ini, jadi fitur download dan "lanjut dari histori" tidak akan bekerja ketika kamu menggunakan server "lokal". Harap gunakan server ini sebagai alternatif akhir jika server lain tidak berfungsi.
- Menambahkan tombol "close" informasi tambahan ketika memutar melalui server pihak ketiga (melalui WebView)
- Otomatis scroll ke resolusi yang saat ini dipilih saat membuka Dropdown pemilihan resolusi (revert ke update sebelumnya)

## Perbaikan

- Memperbaiki masalah stuck di loading screen pada bagian mengambil data movie yang cukup acak terjadi.
  > Perlu diingat jika error saat mengambil data movie terjadi, cobalah untuk mematikan VPN/proxy, menghidupkan dan mematikan ulang mode pesawat, mematikan DNS pribadi.
- Memperbaiki (kayaknya sih udah bener hehehe) masalah yang terjadi dengan server AceFile ketika mengambil data yang seharusnya ada.
- Dan beberapa perbaikan kecil lainnya...

# v0.7.2-JS_1 (19-Desember-2024)

MOVIE BETA TAHAP 1.
Ini adalah update yang cukup besar yang sudah di kerjakan developer selama kurang lebih 1 bulan!!
Update kali ini menambahkan dukungan movie ke dalam aplikasi, karena ini tahap pertama, kamu mungkin menemukan fitur yang kurang, tidak bekerja dengan benar, bugs, error dan lain-lain... harap nantikan hingga data movie stabil yang kemungkinan akan ada di versi selanjutnya.

Di tahap pertama ini kamu belum bisa mencari judul anime movie, dan menyimpan movie di tonton nanti. Namun untuk update selanjutnya diperkirakan fitur-fitur ini sudah lengkap kembali dengan berbagai macam perbaikan dan penyempurnaan.

Saya selaku developer mengucapkan terima kasih karena sudah setia menggunakan aplikasi ini, jika ada keluhan atau saran bisa disampaikan lewat server discord (join dengan cara menekan tombol Join Discord di Loading Screen awal aplikasi).

## Penambahan

- Menambahkan dukungan anime movie!
  > Untuk saat ini kamu hanya bisa menonton movie terbaru, belum bisa mencari judul movie, dan belum bisa menyimpan movie ke daftar tonton nanti.

## Perubahan

- Saat terjadi error, sekarang hanya akan memunculkan pesan singkat alih-alih pesan yang sangat amat panjang dan ternyata tidak terlalu berguna
- Linear color gradient di bagian episode anime sekarang gelap/terang tergantung dark mode di HP kamu
- UI yang diperbagus
  - Menyocokkan beberapa warna dengan light mode
  - Banyak perubahan lain...
- Perubahan lain di dalam di kode aplikasi (tidak begitu terlihat pada pengguna)

## Perbaikan

- Memperbaiki masalah mengganti resolusi di server desudrive

# v0.7.2 (08-November-2024)

## Penambahan

- Menambahkan header di bagian video (streaming)

## Perubahan lain

- Upgrade dependencies ke versi terbaru untuk persiapan react-native 0.76

# v0.7.1-JS_3 (06-Oktober-2024)

## Perbaikan

- Menambah sistem bypass cloudflare

# v0.7.1-JS_2 (16-September-2024)

## Perubahan

- Memblokir anime dengan genre `Ecchi` dan sejenisnya.
  > Ini bertujuan untuk menjaga aplikasi agar tetap aman untuk semua umur


  > Jika kamu merasa anime yang diblokir ternyata aman untuk semua umur, kamu bisa coba meminta untuk anime nya di Whitelist dengan cara menekan tombol `Request Whitelist` dan tunggu pengumuman di server discord.

# v0.7.1-JS_1 (30-Agustus-2024)

## Perbaikan

- Memperbaiki loading "Infinite Loading" pada menu pencarian

# v0.7.1 (30-Agustus-2024)

## Perubahan

- Upgrade React-Native ke versi 0.75

## Perbaikan

- Memperbaiki masalah streaming anime
- Memperbaiki masalah pergantian resolusi

*Catatan: Fitur dan perubahan lain akan di update secara terpisah melalui OTA update.*

# v0.7.0-JS_1 (11-Agustus-2024)

## Penambahan

- [Cari anime berdasarkan gambar]: Memungkinkan kamu untuk melihat potongan adegan dengan menekan pada bagian anime yang ingin kamu lihat

## Perbaikan

- Memperbaiki masalah bahasa pada bagian `histori` dan `tonton nanti` yang muncul pada kasus tertentu

# v0.7.0 (10-Agustus-2024)

Versi ini memperkenalkan OTA update agar update aplikasi menjadi lebih ringan, mudah, dan cepat untuk pengguna dan developer.

## Penambahan
- Menambahkan OTA update ke aplikasi:
  > Menggunakan CodePush

  > Mulai versi 0.7.0 dan seterusnya, update penting aplikasi yang tidak memerlukan download ulang aplikasi akan di rilis melalui CodePush dan dapat diinstal oleh pengguna secara langsung dari aplikasi.

## Perubahan

- Sedikit menambah detail pada bagian pencarian
- Mengganti metode pencadangan database
  > Menggunakan SAF (Storage Access Framework) agar pengguna bisa memilih lokasi, dan nama file yang akan di backup.

## Perbaikan

- Memperbaiki masalah saat membatalkan pergantian resolusi atau episode
- Memperbaiki beberapa masalah styling
- Memperbaiki kebanyakan tombol terkadang tidak berfungsi (tidak merespon)

Dan banyak lagi perubahan kecil lain...

# v0.6.5

Versi ini berisi beberapa perbaikan penting untuk aplikasi.
Note: aplikasi sendiri masih berjalan di old architecture karena masalah kestabilan

## Perbaikan
- Memperbaiki masalah server streaming `odstream` error
- Memperbaiki masalah izin pada android < 13:
  - Memperbaiki crash saat mendownload anime
  - Memperbaiki masalah tidak bisa backup data
- Mengatasi masalah desain tampilan pada layar ponsel yang kecil
- Memperbaiki masalah status bar yang disembunyikan ketika membuka menu (modal) seperti ketika mengganti resolusi

## Perubahan lain
- Memperbaiki dan merubah sedikit tampilan agar lebih baik
- Perubahan kecil di bagian kode (tidak terlihat pada pengguna)
- Sekarang, video player tidak akan pause saat kamu melihat / membuka status bar (notifikasi, persentase baterai, dll...)

# v0.6.4

Dari segi pengembangan dan program, versi ini kemungkin adalah versi terakhir yang menggunakan react-native `old architecture`, kemungkinan besar di versi selanjutnya akan menggunakan `new architecture (fabric)`!

## Penambahan
- Menambahkan splash screen ke dalam aplikasi
- Menambahkan copilot (tutorial) ke bagian tonton nanti, dikarenakan banyak yang belum tahu cara menambahkan anime ke daftar tonton nanti
- Menambahkan animasi ke dalam video control

## Perbaikan/Perubahan
- Sedikit perubahan pada layar "Menghubungkan ke server"
- Memperbaiki status bar yang tidak berubah warna sesuai dengan tema sistem.
- Merubah beberapa pewarnaan komponen
- Memperbaiki tampilan fullscreen yang tidak sepenuhnya "full" atau penuh
- Merubah beberapa ikon di dalam aplikasi
- Memperbaiki status bar yang tidak kembali di sembunyikan setelah muncul
- Memperbaiki masalah animasi pada teks berjalan di bagian beranda
- Memperbaiki masalah database pada pengguna baru
- Memperbaiki masalah pengecekan versi
- Memperbaiki error di beberapa anime/movie
- Memperbaiki error/crash di bagian pencarian
- Memperbaiki reload video player/webview tidak bekerja

# v0.6.3

## Perbaikan
- Memperbaiki masalah error pada hampir semua anime/episode
- Memperbaiki masalah changelog yang tidak tampil
- Memperbaiki masalah pada saat mengganti resolusi/server

# v0.6.2

## Penambahan
- Menambahkan `Catatan Rilis` ke bagian utilitas

## Perbaikan & Perubahan
- Beberapa anime lawas banyak yang eror, oleh karena itu, kamu sekarang dapat memilih secara manual server yang akan digunakan berikut bersama dengan resolusi nya.

# v0.6.1

Perbaikan masalah streaming untuk anime yang baru rilis.

## Perbaikan
- Memperbaiki masalah ketika streaming anime yang baru rilis
- Memperbaiki masalah WebView

## Perubahan penting
- Mulai sekarang, Minimum versi Android untuk menggunakan aplikasi ini adalah android 6

## Perubahan lain
- Upgrade versi react-native ke 0.74-rc.6
- Dan beberapa perubahan kecil lain...

# v0.6.0

Versi ini mengandung banyak perubahan kode yang akan sangat berguna untuk perubahan di masa mendatang. Versi ini juga mengandung perubahan yang meningkatkan performa, penyederhanaan layout, perbaikan bug, perubahan video player, perubahan fitur chat(sekarang menggunakan bing), dan lain-lain.

## Penambahan

- Menambahkan fitur mencari scene anime berdasarkan gambar/screenshot

## Perubahan/perbaikan

- Pilihan untuk menggunakan BING AI di bagian chat
- Mengganti video player - Buatan sendiri :v
- Memperbaiki masalah gagal loading gambar
- Memperbaiki masalah gagal mengecek versi aplikasi yang akan mengakibatkan gagal untuk koneksi ke server
- Memperbaiki masalah saat mengganti dari 'mode malam' ke 'mode terang' dan sebaliknya
- Memperbaiki masalah frame drop ketika loading list anime di bagian penarian (belum sepenuhnya terselesaikan)

## Penghapusan

- Menghapus pengaturan kunci orientasi - dikarenakan orientasi akan otomatis dikunci ke portrait (kecuali saat menonton)
- Menghapus pengaturan download melalui browser - dikarenakan data yang digunakan saat ini mustahil untuk di download lewat browser

## Perubahan lain

- Perubahan lisensi kode dari CC BY-NC ke GNU GPLv3
- Menambahkan informasi yang mungkin berguna ketika gagal koneksi ke server
- Memperbagus sedikit tampilan
- Dan masih banyak perubahan lainnya...