"""Копирует камни из выгрузки в public/images/stones и пишет src/content/stone-catalog.json."""

import json
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\Users\aroll\Downloads") / "Новая папка"
DEST_IMG = Path(r"C:\Projects\ArtellRock\ArtellRock\public\images\stones")
OUT = Path(r"C:\Projects\ArtellRock\ArtellRock\src\content\stone-catalog.json")

BRANDS = {
    "Aleph Stone": "aleph-stone",
    "Asterum": "asterum",
    "AvantQuartz": "avant",
    "AvaRus": "avarus",
    "Belenco": "belenco",
    "CaesarStone": "caesarstone",
    "Etna Quartz": "etna",
    "Noblle Quartz": "noblle",
    "PrimaxQuartz": "primax",
    "Quantra Quartz": "quantra",
    "Radianz": "radianz",
    "SmartQuartz": "smart",
    "StillStone": "still-stone",
    "TechniStone": "technistone",
    "VicoStone": "vicostone",
}

RU = str.maketrans(
    {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "y",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "h",
        "ц": "ts",
        "ч": "ch",
        "ш": "sh",
        "щ": "sch",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
    }
)


def slugify(text: str) -> str:
    value = text.strip().lower().translate(RU)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def display_name(title: str, source_brand: str) -> str:
    name = title.strip()
    if name.lower().startswith(source_brand.lower()):
        name = name[len(source_brand) :].strip(" -—")
    return name or title.strip()


def _band(pixels: list, width: int, x0: int, y0: int, x1: int, y1: int):
    """Средний цвет, яркость и разброс яркости прямоугольника."""
    total = [0.0, 0.0, 0.0]
    luma_sum = 0.0
    count = 0
    samples: list[float] = []
    for y in range(y0, y1):
        row = y * width
        for x in range(x0, x1):
            pixel = pixels[row + x]
            total[0] += pixel[0]
            total[1] += pixel[1]
            total[2] += pixel[2]
            luma = 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]
            samples.append(luma)
            luma_sum += luma
            count += 1
    mean_luma = luma_sum / count
    variance = sum((value - mean_luma) ** 2 for value in samples) / count
    mean_rgb = (total[0] / count, total[1] / count, total[2] / count)
    return mean_rgb, mean_luma, variance ** 0.5


def texture_profile(path: Path) -> tuple[int, float]:
    """Группа кадра и оценка. Группа 0 — рисунок на весь кадр, 1 — поля, 2 — интерьер.

    Белые или чёрные поля (слэб «в рамке») идут после рисунка, но раньше склада:
    у интерьера края сильно расходятся с серединой.
    """
    image = Image.open(path).convert("RGB")
    image.thumbnail((120, 120))
    width, height = image.size
    pixels = list(image.get_flattened_data())

    y_margin = max(2, height // 8)
    x_margin = max(2, width // 8)
    top = _band(pixels, width, 0, 0, width, y_margin)
    bottom = _band(pixels, width, 0, height - y_margin, width, height)
    left = _band(pixels, width, 0, 0, x_margin, height)
    right = _band(pixels, width, width - x_margin, 0, width, height)
    middle = _band(pixels, width, 0, height // 3, width, (2 * height) // 3)

    def blank(stats) -> bool:
        _rgb, mean_luma, deviation = stats
        return deviation < 1.5 and (mean_luma > 248 or mean_luma < 8)

    corner_margin = max(3, min(width, height) // 7)
    corners = [
        _band(pixels, width, 0, 0, corner_margin, corner_margin),
        _band(pixels, width, width - corner_margin, 0, width, corner_margin),
        _band(pixels, width, 0, height - corner_margin, corner_margin, height),
        _band(pixels, width, width - corner_margin, height - corner_margin, width, height),
    ]
    spread = 0.0
    for left_index in range(4):
        for right_index in range(left_index + 1, 4):
            distance = sum(
                (corners[left_index][0][channel] - corners[right_index][0][channel]) ** 2 for channel in range(3)
            ) ** 0.5
            if distance > spread:
                spread = distance

    # Два и больше пустых края — поля вокруг образца, а не сам рисунок.
    padded = sum(1 for edge in (top, bottom, left, right) if blank(edge)) >= 2
    contrast = abs(top[1] - middle[1]) + abs(bottom[1] - middle[1])
    rank = spread * 2 + contrast * 0.45
    # 0 — рисунок доходит до краёв, 1 — образец в полях, 2 — интерьер или склад.
    # Порог выше жильного рисунка (около 140) и ниже склада (от ~300).
    if padded:
        bucket = 1
    elif rank >= 220:
        bucket = 2
    else:
        bucket = 0
    return bucket, rank


def texture_rank(path: Path) -> float:
    _bucket, rank = texture_profile(path)
    return rank


def texture_first(paths: list[Path]) -> list[Path]:
    if len(paths) < 2:
        return paths
    ranked: list[tuple[int, int, Path]] = []
    for index, path in enumerate(paths):
        try:
            bucket, _rank = texture_profile(path)
        except OSError:
            bucket = 2
        # Внутри одной группы порядок галереи не трогаем: не подменяем удачный рисунок соседним.
        ranked.append((bucket, index, path))
    ranked.sort()
    return [path for _, _, path in ranked]


def clean_description(text: str) -> str:
    lines = []
    for line in text.replace("\r\n", "\n").split("\n"):
        low = line.lower()
        if "agl.center" in low or "центр агломерата" in low:
            continue
        lines.append(line.rstrip())
    return "\n".join(lines).strip()


def main() -> None:
    data = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    used: dict[str, set[str]] = {}
    stones = []
    missing = 0
    copied = 0
    skipped_brand = 0

    for product in data["products"]:
        source_brand = product.get("brand") or ""
        brand_slug = BRANDS.get(source_brand)
        if not brand_slug:
            skipped_brand += 1
            continue

        name = display_name(product.get("title") or "", source_brand)
        sku = (product.get("sku") or "").strip()
        base = slugify(f"{sku} {name}" if sku else name) or f"stone-{product.get('uid')}"
        taken = used.setdefault(brand_slug, set())
        slug = base
        n = 2
        while slug in taken:
            slug = f"{base}-{n}"
            n += 1
        taken.add(slug)

        copied_paths: list[Path] = []
        for index, image in enumerate(product.get("images") or [], start=1):
            rel = image.get("file") or ""
            src = ROOT / rel
            if not src.is_file():
                missing += 1
                continue
            ext = src.suffix.lower() or ".jpg"
            dest = DEST_IMG / brand_slug / slug / f"{index:02d}{ext}"
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or dest.stat().st_size != src.stat().st_size:
                shutil.copy2(src, dest)
                copied += 1
            copied_paths.append(dest)

        images = [f"/images/stones/{brand_slug}/{slug}/{path.name}" for path in texture_first(copied_paths)]

        characteristics = []
        for item in product.get("characteristics") or []:
            title = (item.get("title") or "").strip()
            value = (item.get("value") or "").strip()
            if title and value:
                characteristics.append({"title": title, "value": value})

        stones.append(
            {
                "brandSlug": brand_slug,
                "slug": slug,
                "name": name,
                "sku": sku,
                "description": clean_description(product.get("description") or ""),
                "characteristics": characteristics,
                "images": images,
            }
        )

    OUT.write_text(json.dumps(stones, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        f"stones={len(stones)} copied={copied} missing_images={missing} unknown_brand={skipped_brand} json={OUT.stat().st_size}"
    )


if __name__ == "__main__":
    main()
