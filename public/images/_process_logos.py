"""Remove Doubao watermark from bottom-right and compress logo PNGs."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parent
BACKUP = ROOT / "_originals"
OUT_MAX = 1024


def is_light_background(im: Image.Image) -> bool:
    w, h = im.size
    sample = im.crop((int(w * 0.85), int(h * 0.93), w, h))
    mean = ImageStat.Stat(sample).mean
    return sum(mean) / 3 > 200


def detect_checker_tile(im: Image.Image) -> int | None:
    """Detect checkerboard tile size from a clean top-left patch; None if flat."""
    patch = im.convert("L").crop((0, 0, 128, 128))
    px = patch.load()
    base = px[0, 0]
    for x in range(1, 64):
        if abs(px[x, 0] - base) > 8:
            return x
    return None


def fill_checkerboard(im: Image.Image, box: tuple[int, int, int, int], tile: int) -> None:
    x0, y0, x1, y1 = box
    # Sample the two checker colors from a clean area
    gray = im.convert("L")
    c0 = gray.getpixel((tile // 2, tile // 2))
    c1 = gray.getpixel((tile + tile // 2, tile // 2))
    # Prefer RGB from nearby light pixels
    color_a = im.getpixel((tile // 2, tile // 2))
    color_b = im.getpixel((tile + tile // 2, tile // 2))
    if abs(c0 - c1) < 4:
        color_a = (255, 255, 255)
        color_b = (235, 235, 235)
    draw = ImageDraw.Draw(im)
    for y in range(y0, y1):
        for x in range(x0, x1):
            use_b = ((x // tile) + (y // tile)) % 2 == 1
            draw.point((x, y), fill=color_b if use_b else color_a)


def cover_watermark(im: Image.Image) -> Image.Image:
    w, h = im.size
    # Watermark is only in the far bottom-right; keep patch small
    x0 = int(w * 0.62)
    y0 = int(h * 0.915)
    out = im.copy()

    if is_light_background(im):
        tile = detect_checker_tile(im)
        if tile:
            fill_checkerboard(out, (x0, y0, w, h), tile)
        else:
            sample = im.crop((x0, max(0, y0 - 48), w, y0))
            mean = ImageStat.Stat(sample).mean
            fill = tuple(int(round(c)) for c in mean)
            ImageDraw.Draw(out).rectangle((x0, y0, w, h), fill=fill)
        return out

    px = out.load()
    src_y = max(0, y0 - 1)
    for x in range(x0, w):
        color = px[x, src_y]
        for y in range(y0, h):
            px[x, y] = color
    return out


def resize_max(im: Image.Image, max_edge: int) -> Image.Image:
    w, h = im.size
    if max(w, h) <= max_edge:
        return im
    scale = max_edge / float(max(w, h))
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def process(name: str) -> None:
    src = ROOT / name
    BACKUP.mkdir(exist_ok=True)
    backup_path = BACKUP / name
    if not backup_path.exists():
        backup_path.write_bytes(src.read_bytes())
        print("backed up", name)

    im = Image.open(backup_path).convert("RGB")
    cleaned = cover_watermark(im)
    compressed = resize_max(cleaned, OUT_MAX)
    compressed.save(src, format="PNG", optimize=True, compress_level=9)

    before = backup_path.stat().st_size
    after = src.stat().st_size
    print(
        f"{name}: {im.size} -> {compressed.size} | "
        f"{before / 1024:.0f}KB -> {after / 1024:.0f}KB ({after / before * 100:.1f}%)"
    )


def main() -> None:
    for name in [
        "well-design.png",
        "well-design2.png",
        "well-design3.png",
        "well-design4.png",
        "well-design5.png",
    ]:
        process(name)


if __name__ == "__main__":
    main()
