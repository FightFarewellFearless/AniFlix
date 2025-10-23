# v1.1.3_JS-4 (23-Oktober-2025)
Kemungkinan update terakhir di bulan ini (mungkin sampai pertengahan november) karena dev akan melaksanakan ujian TKA, jadi pengembagan aplikasi untuk sementara di tunda agar dev dapat fokus belajar. Versi ini memperbaiki beberapa masalah kecil pada aplikasi
## Perubahan
- Mengizinkan masuk ke beranda meskipun fetch data anime gagal
- Fitur Picture-in-Picture sekarang harus mengaktifkan pengaturan "notifikasi player" di bagian Utilitas -> Pengaturan
- Warna latar changelog
## Diperbaiki
- Refresh indicator yang tersembunyi di beranda
- Cek versi aplikasi stuck
- Durasi teks animasi di beranda
# v1.1.3_JS-3 (17-Oktober-2025)
## Ditingkatkan
- Tampilan bypass cloudflare
## Diperbaiki
- Bypass CloudFlare pada sistem berbahasa indonesia
# v1.1.3_JS-2 (16-Oktober-2025)
## Ditambahkan
- Animasi transisi layar bottom tabs
## Ditingkatkan
- Kecepatan bypass CloudFlare
# v1.1.3_JS-1 (16-Oktober-2025)
## Diperbaiki
- Animasi menyebabkan utilitas blank screen
- Bypass CloudFlare webview
# v1.1.3 (15-Oktober-2025)
## Ditambahkan
- Daftar jadwal anime pada beranda sekarang bisa di sembunyikan
## Ditingkatkan
- Rendering list lebih cepat di beranda
## Diperbaiki
- Potensi perbaikan untuk blank screen pada beberapa device
- Potensi perbaikan bypass cloudflare tidak bekerja pada beberapa device
## Perubahan lain
- Pengoptimalan ukuran aplikasi

# v1.1.2_JS-3 (09-Oktober-2025)
Beberapa perubahan kecil pada kode... (Tidak banyak perubahan yang terlihat pada pengguna)
# v1.1.2_JS-2 (29-September-2025)
## Diperbaiki
- Fitur lapor error dan request whitelist
# v1.1.2_JS-1 (28-September-2025)
## Diperbaiki
- Gambar komik yang tidak ter-load

# v1.1.2 (27-September-2025)
## Ditingkatkan
- Kecepatan loading awal aplikasi
- Durasi animasi teks quote di beranda
- Performa fullscreen saat streaming
## Diperbaiki
- Video tidak menampilkan control saat di mode Picture-in-Picture atau notifikasi meski sudah di aktifkan di pengaturan

# v1.1.1_JS-2 (25-September-2025)
## Diperbaiki
- Masalah data movie setelah bypass anti bot anime

# v1.1.1_JS-1 (25-September-2025)
## Diperbaiki
- Bypass anti bot di pencarian anime

# v1.1.1 (21-September-2025)
Mulai di versi ini, aplikasi hanya mendukung arsitektur ARM demi mengurangi ukuran aplikasi secara drastis
## Ditambahkan
- Dukungan untuk server `pdrain` pada data anime
- Mengizinkan untuk mengubah mode audio mixing saat streaming melalui pengaturan
## Ditingkatkan
- Tampilan informasi terakhir ditonton
- Data `terakhir ditonton` movie
- Sedikit pengurangan delay pada hide/show header dan ukuran panjang seek bar pada saat berganti orientasi di video player
## Diperbaiki
- Crash acak yang terjadi ketika aplikasi di background
## Perubahan lain
- Mulai versi ini aplikasi hanya mendukung ponsel dengan arsitektur ARM

# v1.1.0_JS-2 (08-September-2025)
## Diperbaiki
- Error pada beberapa resolusi anime
- Progress bar pada OTA update

# v1.1.0_JS-1 (07-September-2025)
## Diperbaiki
- Error pada beberapa anime

# v1.1.0 (07-September-2025)

## Ditambahkan
- Lihat semua komik terbaru
## Dihapus
- Migrasi database lama
## Ditingkatkan
- Tampilan video player
- Performa animasi dan scrolling (pada History)
## Diperbaiki
- Error saat ingin menonton anime
## Perubahan lainnya
- Upgrade react-native ke versi 0.81 beserta Expo SDK 54 beta
- Menghilangkan scroll indicator di halaman Beranda detail komik,anime, dan movie
- Mengaktifkan react-native experimental release level agar animasi semakin mulus
- Beberapa perubahan kecil...

# v1.0.2_JS-10 (24-Agustus-2025)
## Ditingkatkan
- Struktur data riwayat tontonan lebih efisien
## Diperbaiki
- Tombol yang tidak bekerja dengan benar
- ...Dan beberapa perubahan kecil lainnya

# v1.0.2_JS-9 (17-Agustus-2025)
## Diperbaiki
- Crash pada layar awal anime

# v1.0.2_JS-8 (17-Agustus-2025)
## Ditingkatkan
- Beberapa peningkatan kecil termasuk list yang sedikit lebih mulus dan pewarnaan pada layar `Dukung developer`
## Disesuaikan
- Posisi dan durasi SnackBar pada `ComicsReading`
## Diperbaiki
- Memperbaiki tombol `scroll to top` yang tersembunyi mengakibatkan list tidak bisa di scroll pada layar `History`

# v1.0.2_JS-7 (16-Agustus-2025)
## Diperbaiki
- Terakhir ditonton dipicu oleh semua episode anime di layar detail anime

# v1.0.2_JS-6 (15-Agustus-2025)
## Diperbaiki
- Gagal mendapatkan Thumbnail/Cover komik
- Masalah performa pada layar Update aplikasi

# v1.0.2_JS-5 (09-Agustus-2025)
## Diperbaiki
- Memperbaiki error thumbnail komik

# v1.0.2_JS-4 (07-Agustus-2025)
## Diperbaiki
- Update domain

# v1.0.2_JS-3 (07-Agustus-2025)
## Diperbaiki
- Crash pada history
- Tombol tidak dapat ditekan pada beberapa kasus
- Judul yang tidak konsisten menyebabkan penghapusan list tonton nanti dan fitur `terakhir ditonton` tidak bekerja dengan benar
- Terakhir dibaca pada komik dengan chapter < 10
## Ditingkatkan
- Potensi performa yang lebih baik
- Pewarnaan pada menu `Dukung developer` dan `Tentang aplikasi`

# v1.0.2_JS-2 (03-Agustus-2025)
HBD TO ME!! part 2 hehe :) (Perbaikan tambahan untuk versi JS-1 di hari yang sama)
## Perbaikan
- Masalah integrasi dengan history dan tonton nanti pada judul yang sama antara komik dan anime
## Penyesuaian
- Ukuran font "Terakhir di tonton" pada detail anime

# v1.0.2_JS-1 (03-Agustus-2025)
HBD TO ME!! :)
## Penambahan
- Mengintegrasikan data history dengan detail episode
## Peningkatan
- Mengaktifkan kembali react-compiler untuk performa aplikasi yang maksimal
- Scrolling yang lebih mulus
- Tampilan loading yang sedikit lebih baik

# v1.0.2 (27-Juli-2025)

## Peningkatan
- Loading list anime yang lebih cepat dengan multi-thread
## Perubahan lain
- Bump dependencies
- Upgrade react-native-reanimated ke versi 4

# v1.0.1_JS-1 (20-Juli-2025)
## Diperbaiki
- Masalah tonton nanti yang tidak secara otomatis dihapus pada tipe anime
- Typo di error anime movie
- Padding bawah ekstra di Beranda
- Tampilan fullscreen yang tidak kembali normal setelah aplikasi restart

# v1.0.1 (9-Juli-2025)

Update kali ini memperbaiki tampilan edge-to-edge sekaligus mengaktifkannya untuk seluruh versi android, serta beberapa perbaikan dan peningkatan tampilan.
## Ditambahkan
- Tombol fullscreen ketika membaca komik
## Disesuaikan
- Mengaktifkan tampilan edge-to-edge untuk semua versi android
- Pewarnaan yang lebih konsisten
- Kecepatan animasi quote disesuaikan agar sesuai dengan panjang teks
## Diperbaiki
- Beberapa perbaikan kecil...

# v1.0.0_JS-3 (28-Juni-2025)
## Diperbaiki
- Tampilan tombol "Tambahkan ke tonton nanti" di mode terang
## Perubahan lain-lain
- Mengaktifkan react-compiler untuk performa yang lebih baik
- Menambahkan efek bayangan pada gambar di bagian detail episode/chapter

# v1.0.0_JS-2 (27-Juni-2025)
## Diperbaiki
- Crash pada pencarian
- List watch later yang otomatis dihapus salah
## Perubahan lain-lain
- Memperbarui waktu di histori ketika berganti chapter komik

# v1.0.0_JS-1 (24-Juni-2025)
## Diperbaiki
- Race condition pada saat menghapus histori pencarian
- Histori pencarian yang terbalik ketika di restore dari backup
- Histori anime yang tertimpa dengan histori komik dengan judul yang sama persis

# v1.0.0 (22-Juni-2025)

**Versi 1.0.0 sudah rilis 🎉**
Versi ini berisi peningkatan tampilan dan efisiensi penggunaan memori, peningkatan stabilitas aplikasi, dan yang paling penting: **Menambahkan komik ke dalam aplikasi (Manga, Manhwa, Manhua)**
## Ditambahkan (Fitur baru)
- Komik (Manga, Manhwa, Manhua)
## Ditingkatkan
- Tampilan aplikasi pada beberapa bagian
- Efisiensi penggunaan memori
- Stabilitas aplikasi
- Dan masih banyak lagi...
### Catatan penting
Pastikan untuk segera memperbarui aplikasi ke versi terbaru. Versi ini tidak hanya menawarkan tampilan yang lebih baik, tetapi juga menyertakan pembaruan database yang kedua kali nya. Migrasi database akan berlangsung otomatis, dan Kamu tidak akan kehilangan data apa pun saat ini.

Penting untuk diingat bahwa di versi mendatang, database lama akan **DIHAPUS** untuk menjaga efisiensi dan stabilitas aplikasi. Ini berarti jika Kamu masih menggunakan versi lama (di bawah v1) dan memperbarui nanti, Kamu berisiko kehilangan data aplikasi seperti riwayat, daftar tonton nanti, pengaturan, dan lainnya. **Jadi, segera perbarui sekarang!**

# v0.9.0_JS-18 (9-Juni-2025)
## Diperbaiki
- Memperbaiki seek bar pada video player yang delay setelah melanjutkan dari history tontonan (Silent update pada JS-17)
- Warna background pada `AniDetail` yang tidak konsisten antara dark mode dan light mode

# v0.9.0_JS-17 (9-Juni-2025)
## Diperbaiki
- Interval history update

# v0.9.0_JS-16 (9-Juni-2025)
## Diperbaiki
- Race condition pada data histori
## Ditingkatkan
- UI/UX pada layar episode anime

# v0.9.0_JS-15 (8-Juni-2025)
## Ditambahkan
- Dukungan untuk banyak episode pada data movie (seperti pada `Kaguya-sama` special episode)
## Diperbaiki
- Ikon error tidak berapa tepat di tengah video player
## Ditingkatkan
- Tampilan Text Input pada layar pencarian menggunakan react-native-paper dengan desain Material 3
## Lainnya
- Menjalankan garbage-collector pada saat keluar dari layar `Video` untuk free-up RAM

# v0.9.0_JS-14 (7-Juni-2025)
## Diperbaiki
- Ukuran hit rect pada tombol pilih resolusi
- Crash ketika spam keyboard dan tombol pencarian
- Feedback (alert) yang tidak muncul ketika melaporkan crash

# v0.9.0_JS-13 (6-Juni-2025)
Versi ini memperbaiki masalah styling pada animasi skeleton dan warna navigasi sistem

# v0.9.0_JS-12 (6-Juni-2025)
## Ditambahkan 
- Konfirmasi saat ingin menghapus daftar tonton nanti
## Diperbaiki
- History list menjadi kosong saat ukuran layar/window terlalu kecil
## Ditingkatkan
- styling pada bagian `History` dan `WatchLater`

# v0.9.0_JS-11 (5-Juni-2025)
## Diperbaiki
- Tampilan edge-to-edge pada saat streaming (tombol download yang tertutup navigasi sistem)
- Masalah layout pada list anime
## Ditingkatkan
- Membuat beberapa layout lebih responsif terhadap berbagai ukuran jendela
  > perubahan terkait dengan responsive layout lainnya akan di update di versi mendatang.
- UI pada list anime dan hasil search anime
- Data fetching pada saat refresh data di beranda

# v0.9.0_JS-10 (30-Mei-2025)
## Diperbaiki
- Pesan error tidak muncul

# v0.9.0_JS-9 (30-Mei-2025)
## Diperbaiki
- Masalah beberapa tombol yang tidak bisa ditekan pada kasus tertentu

# v0.9.0_JS-8 (29-Mei-2025)
## Perubahan lain
- Memaksa render ulang video player setiap ada perubahan streaming link

# v0.9.0_JS-7 (29-Mei-2025)
## Ditingkatkan
- Tampilan pada menu utilitas
- Tampilan dialog yang lebih baik
- Tampilan koneksi ke server dioptimalkan
- Tampilan "Cari anime berdasarkan gambar"

# v0.9.0_JS-6 (10-Mei-2025)
## Diperbaiki
- Extra padding pada bagian bawah ketika navigasi.
  > Terlihat lebih sering pada perangkat lawas

# v0.9.0_JS-5 (5-Mei-2025)
## Diperbaiki
- Tampilan edge-to-edge pada bagian pemutaran
- "Jumping layout" saat mengganti quotes di Beranda
- Improvisasi list anime

# v0.9.0_JS-4 (1-Mei-2025)
## Diperbaiki
- Tampilan fullscreen

# v0.9.0_JS-3 (28-April-2025)
## Diperbaiki
- Tampilan edge-to-edge pada android 15

# v0.9.0_JS-2 (27-April-2025)
## Diperbaiki
- Episode list yang tidak bisa di scroll pada detail anime

# v0.9.0_JS-1 (25-April-2025)
## Perubahan
- Sekarang, notifikasi "now playing" dimatikan secara bawaan. Kamu bisa mengaktifkan nya di menu pengaturan
## Diperbaiki
- Memperbaiki masalah tombol yang tidak bisa ditekan di bagian Video (terjadi di beberapa kasus tertentu)
- Memperbaiki scroll yang ter-reset saat menghapus histori pencarian
## Perubahan lainnya (Tidak berdampak secara langsung)
- Mengurangi delay pada loading listAnime
- list anime yang lebih efisien

# v0.9.0 (18-April-2025)
Versi ini berisi optimasi yang cukup besar untuk kode aplikasi dan pengalaman menggunakan aplikasi termasuk design ulang beberapa antarmuka aplikasi.
Migrasi database ke MMKV agar performa aplikasi semakin meningkat. Serta eliminasi beberapa kode yang dirasa tidak terlalu penting (penggunaan redux, dll..), ini meningkatkan performa aplikasi terutama untuk perangkat lawas.
Fun fact: Update kali ini berisi lebih dari 140 commits di github

## Ditambahkan
- Opsi untuk memuat ulang aplikasi di menu pengaturan
- Tampilan Error untuk menghindari aplikasi crash (hanya berlaku untuk JavaScript dan tidak untuk native crash)
- Fitur Picture-in-Picture saat menonton
- Notifikasi "Now playing" saat menonton
## Ditingkatkan
- Tampilan aplikasi
- Performa aplikasi secara keseluruhan (responsif, animasi, beberapa UI/UX, dan lain-lain...)
- Potensi untuk penggunaan memori yang lebih sedikit.
- Menambahkan informasi panduan pada error history anime lama
## Diperbaiki
- Memperbaiki masalah laporan whitelist anime
- Masalah pada menu dropdown
## Perubahan lain-lain
- Upgrade react-native ke versi 0.79
- Optimasi kode, fokus pada performa dan stabilitas aplikasi
- Migrasi database ke MMKV (Memory-Map Key-Value)
- Bottom tabs sekarang menggunakan native android (BottomNavigationView) oleh react-native-bottom-tabs, ini berarti pengalaman menggunakan aplikasi menjadi lebih mulus dan lancar
- Mengubah Theme aplikasi ke material3 di AndroidManifest.xml mengikuti react-native-bottom-tabs
- Menghapus pengecekan file aplikasi yang tidak perlu saat aplikasi dijalankan
- Dan masih banyak perubahan lainnya...

# v0.8.3-JS_3 (23-Maret-2025)
## Diperbaiki
- Animasi dropdown yang salah ukuran ketika data berubah
- Tema aplikasi yang tidak berubah setelah pemulihan backup

# v0.8.3-JS_2 (19-Maret-2025)
## Ditambahkan
- Opsi mengganti tema aplikasi (gelap/terang) di pengaturan
- Animasi dropdown (Pilih resolusi)
## Ditingkatkan
- Improvisasi lazy loading

# v0.8.3-JS_1 (15-Maret-2025)
## Diperbaiki
- Salah pengukuran tinggi pada animasi sinopsis
## Ditingkatkan
- Mengimplementasi inline-requires

# v0.8.3 (13-Maret-2025)
Upgrade banyak library yang digunakan. Ini mungkin akan memperbaiki beberapa masalah termasuk masalah crash dan masalah lainnya...

# v0.8.2-JS_23 (13-Maret-2025)
## Diperbaiki
- Memperbaiki animasi sinopsis yang "jumping"

# v0.8.2-JS_22 (13-Maret-2025)

Update kali ini menerapkan lazy-loading pada aplikasi, ini berarti penggunaan memori yang lebih efisien, dan waktu mulai aplikasi yang lebih cepat...

## Ditambahkan
- Implementasi lazy-loading
## Ditingkatkan
- Animasi sinopsis
- Meningkatkan `drawDistance` pada list anime di pencarian

# v0.8.2-JS_21 (12-Maret-2025)
## Diperbaiki
- Masalah animasi sinopsis

# v0.8.2-JS_20 (05-Maret-2025)
Update kali ini memberikan opsi donasi kepada kamu yang ingin mendukung pengembangan aplikasi.

## Ditambahkan
- Opsi donasi melalui [saweria](https://saweria.co/pirles) atau [trakteer](https://trakteer.id/pirles).
  > Note: donasi adalah opsional, aplikasi tidak memerlukan biaya sepeser pun untuk digunakan.

  > untuk saat ini belum ada reward khusus untuk donator, baik dari aplikasi maupun server discord, namun jika kamu ingin request sesuatu, kamu bisa join server discord [di sini](https://discord.gg/sbTwxHb9NM) walaupun kamu bukan donator ❤️

# v0.8.2-JS_19 (05-Maret-2025)
Update ini sedikit mengoptimasi kode

# v0.8.2-JS_18 (05-Maret-2025)
Update kali ini menghapus fitur yang tidak lagi terpakai: Chat AI pada menu utilitas

## Diperbaiki
- Animasi sinopsis tidak menampilkan seluruh sinopsis
## Dihapus
- Chat AI. Karena sudah tidak berfungsi dan tidak relevan

# v0.8.2-JS_17 (03-Maret-2025)
## Diperbaiki
- Animasi sinopsis
- Error deteksi anti bot di server `lokal` (movie)

# v0.8.2-JS_16 (03-Maret-2025)
## Diperbaiki:
- Memperbaiki masalah animasi yang tidak mulus saat memperpanjang sinopsis
- Memperbaiki ukuran estimasi list di daftar anime > pencarian

# v0.8.2-JS_15 (02-Maret-2025)
## Ditingkatkan:
- Sedikit mengurangi penggunaan RAM
- Mengembalikan perubahan scrolling list di pencarian pada versi JS_13

# v0.8.2-JS_14 (26-Februari-2025)

Update kali ini menambahkan dukungan untuk menambahkan movie ke dalam daftar tonton nanti

# v0.8.2-JS_13 (26-Februari-2025)
## Peningkatan

- Potensi peningkatan performa scrolling list di pencarian(Eksperimental)
- Meningkatkan animasi memperpanjang sinopsis anime saat menonton

# v0.8.2-JS_12 (23-Februari-2025)
Berisi banyak perubahan kode (Bukan fix bug ataupun fitur, hanya perubahan pada format penulisan kode).
Di update ini juga terdapat peningkatan untuk privasi, dengan menambahkan user-agent tetap, seperti yang dilakukan chrome-based browser.

## Peningkatan
- Potensi peningkatan performa
- Meningkatkan keterbacaan kode dengan ESLint
- Meningkatkan privasi dengan mengubah user-agent menjadi static
  > Ini artinya, mulai versi ini, model hp dan informasi lainnya yang terdapat pada user-agent tidak lagi dikirim pada setiap permintaan ke server

# v0.8.2-JS_11 (20-Februari-2025)
Perubahan kode untuk menambahkan memoization di Beranda agar performa navigasi lebih baik

# v0.8.2-JS_10 (20-Februari-2025)
## Perbaikan
- Memperbaiki masalah tombol "Cari" tidak muncul setelah navigasi ke layar lain (kemungkinan masalah di react-freeze atau react-native-reanimated, diperbaiki dengan menggunakan component Animated bawaan react-native)

# v0.8.2-JS_9 (20-Februari-2025)
Perubahan kecil di kode dengan harapan peningkatan performa

# v0.8.2-JS_8 (20-Februari-2025)
## Penambahan
- Memperlihatkan versi JS di menu update aplikasi
## Perubahan
- Drawer animation diubah dari 'slide' ke 'front' untuk bagian "Saya" (history dan tonton nanti)
- Mengurangi draw distance di list untuk menghindari lag saat render ulang

# v0.8.2-JS_7 (20-Februari-2025)
Mencegah komponen di render ulang menggunakan react-freeze

# v0.8.2-JS_6 (18-Februari-2025)
## Perbaikan
- Memperbaiki pull-to-refresh tidak bekerja pada Beranda
## Peningkatan
- Sedikit mengubah tampilan beranda

# v0.8.2-JS_5 (16-Februari-2025)
## Perbaikan
- Memperbaiki pengambilan data resolusi tetap terjadi meski pengguna sudah membatalkan permintaan

# v0.8.2-JS_4 (16-Februari-2025)
## Perbaikan
- Memperbaiki masalah performa ketika menghapus search history

# v0.8.2-JS_3 (16-Februari-2025)
## Peningkatan
- Meningkatkan pengalaman scrolling pada hampir semua list di aplikasi

# v0.8.2-JS_2 (16-Februari-2025)
(Update ini sama seperti versi JS 1 namun berisi sedikit perbaikan pada kesalahan penulisan kode paga bagian peningkatan pengalaman scrolling di list history)

# v0.8.2-JS_1 (16-Februari-2025)
## Penambahan
- Menambahkan quotes pada loading screen awal aplikasi
## Peningkatan
- Meningkatkan pengalaman scrolling dengan mengurangi blank space dan menambah render ahead offset.
## Perbaikan
- Memperbaiki masalah styling pada tombol tutup di bagian Search ketika tidak ada anime yang ditemukan

# v0.8.2 (09-Februari-2025)
Rilis ini berisi peningkatan performa scrolling list (dan mungkin performa animasi) dan peningkatan desain UI pada beberapa bagian (Update, Search, dan layar loading awal). Juga perbaikan untuk crash pada beberapa anime movie.

Perubahan lainnya meliputi tapi tidak terbatas pada: Upgrade library yang digunakan termasuk react-native 0.77 yang mungkin akan memperbaiki beberapa masalah lain termasuk masalah text yang terpotong pada beberapa device (Berdasarkan RN 0.77 Changelog)
## Peningkatan
- Memperbagus tampilan/UI pada bagian:
   - Update
   - Search (anime list)
   - Tampilan layar awal loading
- Peningkatan performa scrolling dan mungkin juga performa animasi
## Perbaikan
- Memperbaiki crash pada beberapa tipe anime movie
- Memperbaiki gambar cover/thumbnail yang tersimpan di history
## Penghapusan
- Menghapus animasi pada list history
  > Dengan alasan performa

# v0.8.1 (23-Januari-2025)
## Perbaikan
- Memperbaiki masalah pewarnaan saat mengaktifkan dark mode di beberapa perangkat Xiaomi

# v0.8.0-JS_2 (10-Januari-2025)
## Penambahan dan pengoptimalan
- Menambahkan tombol untuk menghapus input pencarian pada menu Histori
- Mengoptimalkan performa ketika mencari judul histori dengan menggunakan deferred value untuk mencegah terlalu banyak render ulang ketika sedang mengetik
## Perbaikan
- Memperbaiki loading indicator menyebabkan list berubah posisi pada menu Search->List anime

# v0.8.0-JS_1 (05-Januari-2025)
## Perbaikan
- Memperbaiki masalah seek bar pada video player

# v0.8.0 (05-Januari-2025)
**New Architecture is finally here!**
Update kali ini merupakan migrasi aplikasi ke react-native New Architecture.
Ini merupakan salah satu update terbesar yang dilakukan developer di balik layar, karena menstabilkan aplikasi di new architecture butuh effort yang cukup besar.
Update kali ini mungkin tidak memberikan banyak perubahan kepada pengguna, namun dari segi renderer aplikasi, ini merupakan perubahan besar.

> NB: Kamu mungkin mengalami masalah performa ketika menggulir list, terutama bagian History, ini adalah masalah dari library FlashList yang memang belum optimal di new architecture.

## Penambahan
- Menambahkan `Tentang aplikasi` pada bagian Utilitas
- Menambahkan Pemberitahuan jika pengguna hendak menonton anime yang telah di `Whitelist` oleh developer
- Menambahkan quotes inspiratif pada bagian Home screen menggantikan pemberitahuan lawas aplikasi
- Dan lain-lain...
## Pengahpusan
- Menghapus animasi pindah layar pada bagian home
## Perubahan
- Mengganti library OTA update dari `react-native-codepush` ke `expo-updates` untuk menjamin kompatibilitas dengan new-architecture
- Migrasi video player dari `expo-av` ke `expo-video`
- Disable text font scaling karena aplikasi tidak di desain untuk mendukung aksesbilitas tersebut
- Beberapa peningkatan video player
  - Mendukung refresh saat terjadi error
  - Otomatis memperlihatkan control saat terjadi error, background, dan berakhirnya video
- Dan masih banyak lagi...

# 0.7.2-JS_3 (29-Desember-2024) 

MOVIE BETA TAHAP 3.
Update kali ini menambahkan fitur pencarian untuk anime movie, serta menambahkan pencarian untuk history, dan peningkatan UI design pada bagian pencarian anime.

## Penambahan & Peningkatan
- Peningkatan UI
- Menambahkan pencarian untuk movie
- Menambahkan fitur mencari judul anime yang sudah ditonton pada bagian Histori
  > Ini mempermudahkan kamu untuk mencari anime yang sudah ditonton secara cepat, terutama pada daftar history yang jumlah nya banyak
- Menambahkan text jumlah history/tonton nanti.

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