"""
Generate Windows application icons for the Electron build.

Source of truth: android/app/src/main/res/playstore-icon.png (512x512, full bleed).

Outputs (into electron/assets/):
  - icon.ico    multi-resolution ICO (16..256) used for the .exe, the taskbar,
                the Start Menu / Desktop shortcuts and the NSIS installer
  - icon.png    256x256 PNG used for notifications / tray

Usage:
  python scripts/generate-icons.py

Requires: Pillow (pip install pillow)
"""

import os
import struct
import zlib

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ELECTRON_DIR = os.path.dirname(HERE)
PROJECT_DIR = os.path.dirname(ELECTRON_DIR)

SOURCE = os.path.join(
    PROJECT_DIR, "android", "app", "src", "main", "res", "playstore-icon.png"
)
OUT_DIR = os.path.join(ELECTRON_DIR, "assets")

# Sizes stored as uncompressed BMP (maximum compatibility with every Windows
# version and with the resource editor used by electron-builder).
BMP_SIZES = [16, 20, 24, 32, 40, 48, 64]
# Sizes stored as PNG (Vista+ / Chromium handle these natively and it keeps
# the file small).
PNG_SIZES = [128, 256]


def resize(source: Image.Image, size: int) -> Image.Image:
    """Resize keeping the icon crisp (no transparency is expected, the source
    is fully opaque)."""
    return source.convert("RGBA").resize((size, size), Image.LANCZOS)


def bmp_entry(image: Image.Image) -> bytes:
    """Encode an image as a 32bpp BMP (DIB) entry for use inside an ICO."""
    width, height = image.size
    # Windows expects BGRA rows stored bottom-up.
    rgba = image.convert("RGBA")
    pixels = rgba.tobytes()  # row-major, top-down, RGBA
    row_bytes = width * 4
    rows = []
    for y in range(height - 1, -1, -1):
        row = pixels[y * row_bytes : (y + 1) * row_bytes]
        bgra = bytearray(row_bytes)
        for x in range(width):
            r, g, b, a = row[x * 4 : x * 4 + 4]
            bgra[x * 4 + 0] = b
            bgra[x * 4 + 1] = g
            bgra[x * 4 + 2] = r
            bgra[x * 4 + 3] = a
        rows.append(bytes(bgra))
    xor_data = b"".join(rows)

    # 1bpp AND mask, rows padded to 4 bytes. The alpha channel carries the
    # transparency so the mask is left empty.
    mask_stride = ((width + 31) // 32) * 4
    and_data = b"\x00" * (mask_stride * height)

    header = struct.pack(
        "<IiiHHIIiiII",
        40,          # biSize
        width,       # biWidth
        height * 2,  # biHeight (XOR + AND)
        1,           # biPlanes
        32,          # biBitCount
        0,           # biCompression (BI_RGB)
        len(xor_data) + len(and_data),
        0,
        0,
        0,
        0,
    )
    return header + xor_data + and_data


def png_entry(image: Image.Image) -> bytes:
    import io

    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def build_ico(images: dict) -> bytes:
    """Assemble an ICO file from {size: image}."""
    entries = []
    for size in sorted(images):
        image = images[size]
        if size in PNG_SIZES:
            data = png_entry(image)
        else:
            data = bmp_entry(image)
        entries.append((size, data))

    header = struct.pack("<HHH", 0, 1, len(entries))
    offset = 6 + 16 * len(entries)
    directory = b""
    payload = b""
    for size, data in entries:
        directory += struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0,
            size if size < 256 else 0,
            0,      # color count
            0,      # reserved
            1,      # color planes
            32,     # bits per pixel
            len(data),
            offset,
        )
        payload += data
        offset += len(data)
    return header + directory + payload


def main() -> None:
    if not os.path.isfile(SOURCE):
        raise SystemExit(f"Source icon not found: {SOURCE}")

    os.makedirs(OUT_DIR, exist_ok=True)
    source = Image.open(SOURCE)

    images = {}
    for size in BMP_SIZES + PNG_SIZES:
        images[size] = resize(source, size)

    ico_path = os.path.join(OUT_DIR, "icon.ico")
    with open(ico_path, "wb") as handle:
        handle.write(build_ico(images))
    print(f"wrote {ico_path} ({os.path.getsize(ico_path)} bytes)")

    png_path = os.path.join(OUT_DIR, "icon.png")
    resize(source, 256).save(png_path, format="PNG", optimize=True)
    print(f"wrote {png_path}")


if __name__ == "__main__":
    main()
