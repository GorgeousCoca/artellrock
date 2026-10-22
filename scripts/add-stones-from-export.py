"""Добавляет в src/content/stone-catalog.json отдельные камни из выгрузки и связывает их с декором витрины.

Список пар — scripts/data/manual-stone-links.json: [{"uid", "brand", "decorName", "decorImage"}].
Камень собирается так же, как в import-stone-catalog.py (фото в public/images/stones, описание, характеристики).
Остальные записи каталога не меняются. Уже добавленный камень (тот же бренд и артикул+название) повторно не пишется.
Связь с декором кладётся в src/content/stone-decor-links.json с пометкой "manual": true:
`scripts/link-stone-decors.ts` такие записи не стирает.

Запуск: python scripts/add-stones-from-export.py
"""

import html
import importlib.util
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("import_stone_catalog", HERE / "import-stone-catalog.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

PAIRS = HERE / "data" / "manual-stone-links.json"
LINKS = Path(base.OUT).with_name("stone-decor-links.json")


def main() -> None:
    products = {p["uid"]: p for p in json.loads((base.ROOT / "catalog.json").read_text(encoding="utf-8"))["products"]}
    pairs = json.loads(PAIRS.read_text(encoding="utf-8"))
    stones = json.loads(base.OUT.read_text(encoding="utf-8"))
    links = json.loads(LINKS.read_text(encoding="utf-8"))

    taken: dict[str, set[str]] = {}
    for stone in stones:
        taken.setdefault(stone["brandSlug"], set()).add(stone["slug"])

    added = 0
    copied = 0
    for pair in pairs:
        product = products.get(pair["uid"])
        if product is None:
            print(f"нет в выгрузке: {pair}")
            continue
        brand_slug = pair["brand"]
        source_brand = product.get("brand") or ""
        title = html.unescape(product.get("title") or "")
        name = base.display_name(title, source_brand)
        sku = (product.get("sku") or "").strip()

        existing = next(
            (
                s
                for s in stones
                if s["brandSlug"] == brand_slug and s["sku"] == sku and s["name"] == name
            ),
            None,
        )
        if existing is None:
            slug_base = base.slugify(f"{sku} {name}" if sku else name) or f"stone-{product.get('uid')}"
            used = taken.setdefault(brand_slug, set())
            slug = slug_base
            n = 2
            while slug in used:
                slug = f"{slug_base}-{n}"
                n += 1
            used.add(slug)

            copied_paths: list[Path] = []
            for index, image in enumerate(product.get("images") or [], start=1):
                src = base.ROOT / (image.get("file") or "")
                if not src.is_file():
                    continue
                ext = src.suffix.lower() or ".jpg"
                dest = base.DEST_IMG / brand_slug / slug / f"{index:02d}{ext}"
                dest.parent.mkdir(parents=True, exist_ok=True)
                if not dest.exists() or dest.stat().st_size != src.stat().st_size:
                    shutil.copy2(src, dest)
                    copied += 1
                copied_paths.append(dest)

            images = [f"/images/stones/{brand_slug}/{slug}/{p.name}" for p in base.texture_first(copied_paths)]
            characteristics = []
            for item in product.get("characteristics") or []:
                t = html.unescape((item.get("title") or "").strip())
                v = html.unescape((item.get("value") or "").strip())
                if t and v:
                    characteristics.append({"title": t, "value": v})

            existing = {
                "brandSlug": brand_slug,
                "slug": slug,
                "name": name,
                "sku": sku,
                "description": base.clean_description(html.unescape(product.get("description") or "")),
                "characteristics": characteristics,
                "images": images,
            }
            stones.append(existing)
            added += 1
            print(f"+ {brand_slug}/{slug} ({len(images)} фото)")

        links[f"{brand_slug}/{existing['slug']}"] = {
            "image": pair["decorImage"],
            "name": pair["decorName"],
            "manual": True,
        }

    base.OUT.write_text(json.dumps(stones, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    ordered = dict(sorted(links.items()))
    LINKS.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"добавлено камней: {added}, скопировано файлов: {copied}, всего камней: {len(stones)}")


if __name__ == "__main__":
    main()
