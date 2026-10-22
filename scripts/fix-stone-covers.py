"""Ставит чистую квадратную текстуру камня первым фото в каждой карточке каталога.

Запуск (из корня проекта):
  python scripts/fix-stone-covers.py            — только отчёт, ничего не пишет;
  python scripts/fix-stone-covers.py --apply    — переставить фото, вырезать недостающие квадраты
                                                  и записать src/content/stone-catalog.json.

Что делает по каждой карточке (src/content/stone-catalog.json → images):
  1. Классифицирует каждый кадр:
       texture — рисунок камня доходит до краёв кадра (нет белых, чёрных и прозрачных полей, нет фона и интерьера);
       slab    — образец в полях или на фоне (слэб «в рамке», на складе);
       scene   — интерьер, кухня, ванная.
     Отдельно считается «квадрат»: стороны кадра различаются не больше чем на 10 %.
  2. Если первым уже стоит квадратная текстура — карточку не трогает.
  3. Если квадратная текстура есть в галерее — переносит её на первое место, прежняя обложка уходит следом.
  4. Если квадратной текстуры нет — вырезает центральный квадрат из лучшего кадра (сначала сплошная текстура
     без фона, затем слэб, затем интерьер, если внутри кадра нашёлся чистый участок камня) и ставит его
     первым как `texture.jpg` рядом с остальными фото камня. Исходные файлы не изменяются.
  5. Если чистого участка камня не нашлось нигде — карточка остаётся как есть и попадает в отчёт.

Результат: reports/stone-covers/report.json, report.md и листы-превью before/after.
После записи нужно синхронизировать кадр материалов в базе: $env:APPLY=1; npm run sync:stones.
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src" / "content" / "stone-catalog.json"
PUBLIC = ROOT / "public"
REPORT_DIR = ROOT / "reports" / "stone-covers"

SQUARE_MIN, SQUARE_MAX = 0.9, 1.1  # w/h
THUMB = 200
# Порог рисунка: жильный рисунок даёт ~140, склад и интерьер — от ~300 (см. import-stone-catalog.py).
SCENE_RANK = 220
COVER_NAME = "texture.jpg"
COVER_MAX_SIDE = 1200
JPEG_QUALITY = 90
# Однородность кадра — наибольшее расстояние между средними цветами плиток 3×3. У чистой текстуры оно до ~65,
# у угла образца с кромкой и фоном (Primax) от ~70, у интерьера — сотни.
H_CLEAN = 70
# Доли короткой стороны, которые пробуем при вырезании квадрата, от большей к меньшей.
CROP_SCALES = {"texture": (0.92, 0.75, 0.6, 0.45), "slab": (0.6, 0.5, 0.4, 0.32), "scene": (0.3, 0.22)}
# Верхняя граница однородности готового квадрата. Для интерьера строже: центр кухни легко принять за камень.
CROP_SPREAD_LIMIT = {"texture": 60.0, "slab": 50.0, "scene": 30.0}
CROP_RANK_LIMIT = {"texture": SCENE_RANK * 0.75, "slab": SCENE_RANK * 0.75, "scene": 90}
# Второй проход для контрастных рисунков (чёрное с белой жилой): пороги мягче, интерьер не берём.
RELAXED = 1.6
MIN_CROP_SIDE_PX = 200
SEARCH_THUMB = 260
# Чтобы перенести кадр из галереи на обложку, он должен быть ещё и очень однородным: ровный квадрат без предметов.
REORDER_MAX_SPREAD = 30
# Бренды, у которых каждый квадратный кадр — угол образца с кромкой и фоном (проверено по превью всех кадров).
# Их обложки не считаем чистой текстурой, квадрат вырезаем из столешницы образца, подальше от кромки.
EDGE_SAMPLE_BRANDS = {"primax"}
EDGE_SCALES = (0.5, 0.42, 0.35)
# Штраф за смещение квадрата от центра кадра: уходим с центра, только если там кромка, фон или подпись.
CENTER_WEIGHT = 90
# Ручные участки там, где автоматика ошиблась (проверено по превью): ключ → (номер кадра, (x0, y0, x1, y1) в долях кадра).
# Во всех кадрах Primax столешница образца — левая верхняя часть, кромка идёт снизу и справа.
TOP_FACE_BOX = (0.0, 0.0, 0.52, 0.52)
MANUAL_BOXES: dict[str, tuple[int, tuple[float, float, float, float]]] = {}


def luma(arr: np.ndarray) -> np.ndarray:
    return 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]


def load_rgb(path: Path) -> tuple[Image.Image, bool]:
    """RGB-копия кадра на белом фоне и признак прозрачных полей по краям."""
    image = Image.open(path)
    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    transparent_edges = False
    if has_alpha:
        rgba = image.convert("RGBA")
        alpha = np.asarray(rgba.getchannel("A").resize((100, 100)), dtype=np.float32)
        ring = np.concatenate([alpha[:6].ravel(), alpha[-6:].ravel(), alpha[:, :6].ravel(), alpha[:, -6:].ravel()])
        transparent_edges = float((ring < 200).mean()) > 0.02
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        return Image.alpha_composite(background, rgba).convert("RGB"), transparent_edges
    return image.convert("RGB"), False


def profile(rgb: Image.Image, transparent_edges: bool = False) -> dict:
    """Группа кадра: texture / slab / scene — и числовая оценка «насколько это не чистый рисунок»."""
    image = rgb.copy()
    image.thumbnail((THUMB, THUMB))
    arr = np.asarray(image, dtype=np.float32)
    height, width = arr.shape[:2]
    lum = luma(arr)

    ty, tx = max(2, height // 8), max(2, width // 8)
    strips = {
        "top": (arr[:ty], lum[:ty]),
        "bottom": (arr[-ty:], lum[-ty:]),
        "left": (arr[:, :tx], lum[:, :tx]),
        "right": (arr[:, -tx:], lum[:, -tx:]),
    }
    middle = lum[height // 3 : (2 * height) // 3]
    centre = lum[height // 4 : (3 * height) // 4, width // 4 : (3 * width) // 4]

    def blank(strip_lum: np.ndarray) -> bool:
        return float(strip_lum.std()) < 5 and (float(strip_lum.mean()) > 240 or float(strip_lum.mean()) < 12)

    blank_edges = sum(1 for _, strip_lum in strips.values() if blank(strip_lum))
    plain_stone = abs(float(centre.mean()) - float(lum[:ty].mean())) < 8 and float(centre.std()) < 6
    padded = transparent_edges or (blank_edges >= 2 and not plain_stone)

    corner = max(3, min(width, height) // 7)
    corners = [
        arr[:corner, :corner].reshape(-1, 3).mean(0),
        arr[:corner, -corner:].reshape(-1, 3).mean(0),
        arr[-corner:, :corner].reshape(-1, 3).mean(0),
        arr[-corner:, -corner:].reshape(-1, 3).mean(0),
    ]
    # Подпись-водяной знак бывает в одном углу кадра: считаем разброс по трём углам без самого выбивающегося.
    def corner_spread(items: list[np.ndarray]) -> float:
        return max(float(np.linalg.norm(a - b)) for i, a in enumerate(items) for b in items[i + 1 :])

    spread = min(corner_spread(corners[:skip] + corners[skip + 1 :]) for skip in range(4))
    contrast = abs(float(lum[:ty].mean()) - float(middle.mean())) + abs(float(lum[-ty:].mean()) - float(middle.mean()))
    rank = spread * 2 + contrast * 0.45

    if padded:
        kind = "slab"
    elif rank >= SCENE_RANK:
        kind = "scene"
    else:
        kind = "texture"
    return {"kind": kind, "rank": round(rank, 1), "padded": padded}


def tile_spread(arr: np.ndarray, n: int = 3) -> float:
    """Однородность: наибольшее расстояние между средними цветами n×n плиток."""
    height, width = arr.shape[:2]
    means = [
        arr[i * height // n : (i + 1) * height // n, j * width // n : (j + 1) * width // n].reshape(-1, 3).mean(0)
        for i in range(n)
        for j in range(n)
    ]
    return max(float(np.linalg.norm(a - b)) for k, a in enumerate(means) for b in means[k + 1 :])


def analyse(path: Path) -> dict:
    rgb, transparent_edges = load_rgb(path)
    width, height = rgb.size
    result = profile(rgb, transparent_edges)
    ratio = width / height
    thumb = rgb.copy()
    thumb.thumbnail((THUMB, THUMB))
    result.update(
        {
            "width": width,
            "height": height,
            "ratio": round(ratio, 3),
            "square": SQUARE_MIN <= ratio <= SQUARE_MAX,
            "spread": round(tile_spread(np.asarray(thumb, dtype=np.float32)), 1),
        }
    )
    return result


def edge_line_score(lum: np.ndarray) -> float:
    """Длинная прямая контрастная линия в квадрате (кромка слэба), в долях стороны. Чистая текстура даёт ~0–0.7."""
    gy, gx = np.gradient(lum)
    magnitude = np.hypot(gx, gy)
    height, width = magnitude.shape
    threshold = max(6.0, float(np.percentile(magnitude, 90)))
    ys, xs = np.nonzero(magnitude > threshold)
    if len(xs) < 15:
        return 0.0
    angles = np.deg2rad(np.arange(0, 180, 3))
    diagonal = int(np.hypot(height, width)) + 1
    index = np.round(xs[:, None] * np.cos(angles)[None] + ys[:, None] * np.sin(angles)[None]).astype(int) + diagonal
    votes = np.zeros((len(angles), 2 * diagonal + 3), dtype=np.int32)
    for k in range(len(angles)):
        np.add.at(votes[k], index[:, k], 1)
    votes = votes + np.roll(votes, 1, 1) + np.roll(votes, -1, 1)
    return float(votes.max()) / min(height, width)


def best_square(rgb: Image.Image, kind: str, factor: float = 1.0, edge_aware: bool = False) -> dict | None:
    """Самый однородный квадрат внутри кадра, ближе к центру. None — чистого участка камня нет.

    Сначала пробуем крупный квадрат по центру, затем меньшие. Если центр задет кромкой, фоном или предметом,
    квадрат сдвигается к однородному месту кадра (штраф за удаление от центра небольшой).
    edge_aware — кадр с кромкой слэба: места с длинной прямой линией получают штраф.
    """
    thumb = rgb.copy()
    thumb.thumbnail((SEARCH_THUMB, SEARCH_THUMB))
    scale_back = rgb.width / thumb.width
    arr = np.asarray(thumb, dtype=np.float32)
    lum_arr = luma(arr)
    thumb_h, thumb_w = arr.shape[:2]
    short = min(thumb_w, thumb_h)
    for scale in EDGE_SCALES if edge_aware else CROP_SCALES[kind]:
        side = int(short * scale)
        if side * scale_back < MIN_CROP_SIDE_PX:
            continue
        best = None
        for y in np.unique(np.linspace(0, thumb_h - side, 5).astype(int)):
            for x in np.unique(np.linspace(0, thumb_w - side, 5).astype(int)):
                spread = tile_spread(arr[y : y + side, x : x + side])
                offset = float(np.hypot((x + side / 2 - thumb_w / 2) / thumb_w, (y + side / 2 - thumb_h / 2) / thumb_h))
                score = spread + CENTER_WEIGHT * offset
                if edge_aware:
                    score += 25 * edge_line_score(lum_arr[y : y + side, x : x + side])
                if best is None or score < best[0]:
                    best = (score, spread, int(x), int(y))
        assert best is not None
        _score, spread, x, y = best
        if spread > CROP_SPREAD_LIMIT[kind] * factor:
            continue
        box = (round(x * scale_back), round(y * scale_back), round((x + side) * scale_back), round((y + side) * scale_back))
        side_px = min(box[2] - box[0], box[3] - box[1])
        crop = rgb.crop((box[0], box[1], box[0] + side_px, box[1] + side_px))
        # Квадрат должен сам быть сплошным рисунком: ни полей, ни перехода в фон, ни предметов.
        verdict = profile(crop)
        if verdict["kind"] == "texture" and verdict["rank"] < CROP_RANK_LIMIT[kind] * factor:
            return {"crop": crop, "scale": scale, "box": list(box), "spread": round(spread, 1)}
    return None


def stone_dir(images: list[str]) -> Path:
    first = PUBLIC / images[0].lstrip("/")
    return first.parent


def plan_stone(stone: dict) -> dict:
    key = f"{stone['brandSlug']}/{stone['slug']}"
    images: list[str] = stone["images"]
    entry: dict = {"key": key, "before": list(images), "action": "keep", "after": list(images), "frames": []}
    if not images:
        entry["action"] = "no-images"
        return entry

    frames = []
    for index, image in enumerate(images):
        info = analyse(PUBLIC / image.lstrip("/"))
        info.update({"index": index, "path": image})
        frames.append(info)
    entry["frames"] = frames

    # Чистый квадрат: рисунок до краёв, нет кромки, фона и предметов.
    edge_sample = stone["brandSlug"] in EDGE_SAMPLE_BRANDS

    def is_clean_square(info: dict) -> bool:
        if info["index"] == 0 and info["square"] and info["path"].endswith(f"/{COVER_NAME}"):
            return True  # квадрат, вырезанный этим скриптом раньше: повторный запуск его не пересобирает
        if edge_sample or not (info["square"] and info["kind"] == "texture"):
            return False
        # Первое фото — уже обложка, ему достаточно быть без кромки. С других мест берём только очень ровный квадрат.
        return info["spread"] <= (H_CLEAN if info["index"] == 0 else REORDER_MAX_SPREAD)

    if is_clean_square(frames[0]):
        entry["action"] = "keep"
        return entry

    square = next((info for info in frames if is_clean_square(info)), None)
    if square:
        entry["action"] = "reorder"
        entry["cover"] = square["path"]
        entry["after"] = [square["path"]] + [image for image in images if image != square["path"]]
        return entry

    manual = MANUAL_BOXES.get(key)
    if manual is None and edge_sample and frames[0]["square"]:
        manual = (0, TOP_FACE_BOX)  # квадратный первый кадр Primax — угол образца: берём левую верхнюю столешницу
    if manual:
        frame_index, (fx0, fy0, fx1, fy1) = manual
        info = frames[frame_index]
        rgb, _ = load_rgb(PUBLIC / info["path"].lstrip("/"))
        width, height = rgb.size
        side = int(min((fx1 - fx0) * width, (fy1 - fy0) * height))
        left, top = round(fx0 * width), round(fy0 * height)
        entry.update(
            {
                "action": "crop",
                "source": info["path"],
                "sourceKind": "manual",
                "relaxed": False,
                "scale": round(side / min(width, height), 2),
                "box": [left, top, left + side, top + side],
                "cropSpread": None,
                "_crop": rgb.crop((left, top, left + side, top + side)),
            }
        )
        entry["cover"] = "/" + (stone_dir(images) / COVER_NAME).relative_to(PUBLIC).as_posix()
        entry["after"] = [entry["cover"]] + [image for image in images if image != entry["cover"]]
        return entry

    # Квадрата нет: ищем кадр, из которого можно вырезать чистый центр.
    for factor, kinds in ((1.0, ("texture", "slab", "scene")), (RELAXED, ("texture", "slab"))):
        for kind in kinds:
            for info in (f for f in frames if f["kind"] == kind):
                rgb, _ = load_rgb(PUBLIC / info["path"].lstrip("/"))
                found = best_square(rgb, kind, factor, edge_aware=edge_sample or info["spread"] > H_CLEAN)
                if found:
                    entry["action"] = "crop"
                    entry["source"] = info["path"]
                    entry["sourceKind"] = kind
                    entry["relaxed"] = factor != 1.0
                    entry["scale"] = found["scale"]
                    entry["box"] = found["box"]
                    entry["cropSpread"] = found["spread"]
                    entry["_crop"] = found["crop"]
                    target = stone_dir(images) / COVER_NAME
                    entry["cover"] = "/" + target.relative_to(PUBLIC).as_posix()
                    entry["after"] = [entry["cover"]] + [image for image in images if image != entry["cover"]]
                    return entry

    entry["action"] = "unresolved"
    return entry


def save_crop(entry: dict) -> None:
    crop: Image.Image = entry.pop("_crop")
    if max(crop.size) > COVER_MAX_SIDE:
        crop = crop.resize((COVER_MAX_SIDE, COVER_MAX_SIDE), Image.LANCZOS)
    target = PUBLIC / entry["cover"].lstrip("/")
    crop.save(target, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    entry["coverSize"] = list(crop.size)


def contact_sheet(rows: list[tuple[str, Path]], out: Path, cols: int = 8, cell: int = 150) -> None:
    sheet_rows = (len(rows) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, sheet_rows * (cell + 14)), "white")
    draw = ImageDraw.Draw(sheet)
    for number, (label, path) in enumerate(rows):
        try:
            image = Image.open(path).convert("RGB")
        except OSError:
            continue
        image.thumbnail((cell - 4, cell - 4))
        x, y = (number % cols) * cell, (number // cols) * (cell + 14)
        sheet.paste(image, (x + 2, y + 14))
        draw.text((x + 2, y + 1), label[:26], fill="black")
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=82)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="записать изменения")
    parser.add_argument("--sheets", action="store_true", help="собрать листы-превью обложек (после --apply: итог)")
    args = parser.parse_args()

    stones = json.loads(CATALOG.read_text(encoding="utf-8"))
    with ProcessPoolExecutor() as pool:
        entries = list(pool.map(plan_stone, stones, chunksize=8))
    counts: dict[str, int] = {}
    for entry in entries:
        counts[entry["action"]] = counts.get(entry["action"], 0) + 1

    print(f"Карточек: {len(stones)}")
    labels = {
        "keep": "обложка уже квадратная текстура",
        "reorder": "переставлена квадратная текстура из галереи",
        "crop": "вырезан центральный квадрат",
        "unresolved": "чистого участка камня нет, не тронуто",
        "no-images": "нет фото",
    }
    for action, label in labels.items():
        print(f"  {action:<10} {counts.get(action, 0):>4}  {label}")

    if args.apply:
        by_key = {f"{stone['brandSlug']}/{stone['slug']}": stone for stone in stones}
        for entry in entries:
            if entry["action"] == "crop":
                save_crop(entry)
            if entry["action"] in ("crop", "reorder"):
                by_key[entry["key"]]["images"] = entry["after"]
        CATALOG.write_text(json.dumps(stones, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print("Записано:", CATALOG.relative_to(ROOT))
    else:
        preview = REPORT_DIR / "preview"
        preview.mkdir(parents=True, exist_ok=True)
        for entry in entries:
            crop = entry.pop("_crop", None)
            if crop is not None and args.sheets:
                target = preview / f"{entry['key'].replace('/', '__')}.jpg"
                crop.save(target, "JPEG", quality=85)
                entry["preview"] = str(target)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    suffix = "applied" if args.apply else "dry-run"
    (REPORT_DIR / f"report-{suffix}.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")

    if args.sheets:
        for action in ("crop", "reorder", "unresolved"):
            rows = []
            for entry in entries:
                if entry["action"] != action:
                    continue
                shown = entry["after"][0] if action != "unresolved" else entry["before"][0]
                path = PUBLIC / shown.lstrip("/")
                if "preview" in entry:
                    path = Path(entry["preview"])
                rows.append((entry["key"].split("/")[1], path))
            for part in range(0, len(rows), 80):
                contact_sheet(rows[part : part + 80], REPORT_DIR / f"sheet-{suffix}-{action}-{part // 80 + 1}.jpg")
    return 0


if __name__ == "__main__":
    sys.exit(main())
