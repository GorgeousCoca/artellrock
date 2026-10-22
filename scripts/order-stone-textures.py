"""Ставит плоский рисунок камня первым в галерее каждого декора."""

import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parent / "import-stone-catalog.py"
spec = importlib.util.spec_from_file_location("import_stone_catalog", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)
texture_first = module.texture_first

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src" / "content" / "stone-catalog.json"
PUBLIC = ROOT / "public"


def main() -> None:
    stones = json.loads(CATALOG.read_text(encoding="utf-8"))
    moved = 0
    for stone in stones:
        paths = [PUBLIC / image.lstrip("/") for image in stone["images"]]
        ordered = texture_first(paths)
        images = ["/" + path.relative_to(PUBLIC).as_posix() for path in ordered]
        if images != stone["images"]:
            moved += 1
            stone["images"] = images
    CATALOG.write_text(json.dumps(stones, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"reordered={moved} stones={len(stones)}")


if __name__ == "__main__":
    main()
