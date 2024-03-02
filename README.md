![screenshot](./githubAssets/screenshot.jpg)


# AniFlix

<p align="center">
  <img src="./android/app/src/main/res/playstore-icon.png" width="250" height="250" alt="logo aplikasi">
</p>

[![built with Codeium](https://codeium.com/badges/main)](https://codeium.com/badges/main) ![GitHub top language](https://img.shields.io/github/languages/top/FightFarewellFearless/aniflix) ![license](https://img.shields.io/badge/license-CC%20BY--NC-orange?logo=creativecommons) ![Built with react-native](https://img.shields.io/badge/React%20Native-v0.73.2-blue.svg?style=flat&logo=react) ![Versi terbaru](https://img.shields.io/github/v/tag/FightFarewellFearless/aniflix?label=Versi%20terbaru)



Aplikasi streaming anime gratis tanpa iklan, open source!

**_Written in typescript built with react native_** :heart:

## Lengkap dan terbaru!

Tonton anime favorit mu sekarang! Episode lengkap dan terbaru.

## Mudah digunakan

Target utama kami adalah UI yang simpel dan mudah digunakan.

Download episode anime dengan satu klik. Tonton tanpa login!

## Tanpa iklan

Aplikasi kami tidak memiliki iklan. Satu-satunya iklan adalah ketika memutar video menggunakan pemutar pihak ketiga, dan itu bukan iklan dari kami, kami tidak punya akses sama sekali untuk hal itu.

## Open source

Kode aplikasi tersedia dan dapat kamu gunakan dengan mengikuti aturan yang sudah diterapkan sesuai lisensi di [#License](#license)

# Minimum android

Untuk menggunakan aplikasi ini, minimal dibutuhkan android lolipop (5.0) atau lebih baru.

# Cara Download

Kamu bisa download aplikasi dengan cara berikut ini:

- Pergi ke [Halaman rilis](https://github.com/FightFarewellFearless/AniFlix/releases)
- Pilih rilis terbaru
- Klik bagian **assets**
- Pilih file **anime.apk**

# FAQ

> Q: Apakah aplikasi ini sepenuh nya gratis?

A: ya, aplikasi ini sepenuh nya gratis, kami tidak mendapatkan keuntungan sedikit pun.

> Q: jika tidak dapat keuntungan bagaimana bisa server tetap berjalan?

A: Kami menggunakan server hosting gratis yang tersedia. Tidak ada biaya satu rupiah pun yang dikeluarkan

> Q: Dimana video yang sudah saya download berada?

A: video yang sudah di download bisa kamu temukan di `Penyimpanan Internal/Download/`

> Q: Mengapa ada anime yang diblokir?

A: Kami memblokir anime dengan genre ecchi dan hentai. Tapi ada beberapa anime bergenre ecchi yang diizinkan untuk tayang

# Catatan

- Kami memblokir anime dengan genre ecchi dan hentai agar aplikasi aman untuk semua usia
- Video yang terdapat di aplikasi bukan berasal dari server kami.
Semua video berasal dari server pihak ke tiga dan kami tidak punya akses sama sekali.
- Kami hanya membagikan video yang beredar di internet, kami tidak menyimpan satu video pun di server kami sendiri

# Build from Source

To build the application from source, first, follow the instructions in the [React Native environment setup guide](https://reactnative.dev/docs/environment-setup?guide=native).

Next, clone this GitHub repository using:
```bash
git clone https://github.com/FightFarewellFearless/AniFlix
```
Wait until the download is complete, then navigate to the project directory:
```bash
cd AniFlix
```
You will also need to create your own keystore. [Follow these steps in the React Native documentation](https://reactnative.dev/docs/signed-apk-android#generating-an-upload-key)

Now you are ready to build! Just one last step remains. Install the required npm dependencies:
```bash
npm install --legacy-peer-deps
```

:tada: You're all set up! It's time to build. Run the following command:
```bash
cd android
./gradlew assembleRelease
```
Wait for the build to complete. If successful, you can find the APK in `android/app/build/outputs/apk/release`

# LICENSE


The AniFlix app is free and open source software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3 as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.

