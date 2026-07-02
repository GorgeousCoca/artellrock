import fs from "fs/promises";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";

import { MaterialsStripPreload } from "@/components/home/materials-strip-preload";
import { brandCatalogHref, stoneBrandFolderToSlug } from "@/lib/stone/brands";

const BRANDS_DIR = path.join(process.cwd(), "public", "images");
const BRAND_FOLDERS = [
  "Aleph_Stone",
  "Asterum",
  "Avant_Quartz",
  "Avarus",
  "Belenco",
  "Caesarstone",
  "Etna_Quartz",
  "Noblle_Quartz",
  "Primax",
  "Quantra_Quartz",
  "Radianz_Quartz",
  "Smart_Quartz",
  "Still_Stone",
  "Technistone",
  "Vicostone"
];

/** Было 2 образца на бренд (~30); добавляем ещё 40 уникальных декоров в ленту */
const BASE_TILES_PER_BRAND = 2;
const EXTRA_TILES = 40;

type Tile = { src: string; brand: string; brandFolder: string; alt: string };

function makeTile(brandFolder: string, file: string): Tile {
  const brand = brandFolder.replace(/_/g, " ");
  const decor = file.replace(/\.[^.]+$/i, "");
  return {
    src: `/images/${brandFolder}/${file}`,
    brand,
    brandFolder,
    alt: `${brand} — ${decor}`
  };
}

async function loadTiles(): Promise<Tile[]> {
  const pools: { brandFolder: string; files: string[] }[] = [];

  for (const brandFolder of BRAND_FOLDERS) {
    const dir = path.join(BRANDS_DIR, brandFolder);
    try {
      const entries = await fs.readdir(dir);
      const files = entries
        .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, "ru"));
      if (files.length) {
        pools.push({ brandFolder, files });
      }
    } catch {
      continue;
    }
  }

  const baseline = pools.reduce(
    (sum, pool) => sum + Math.min(pool.files.length, BASE_TILES_PER_BRAND),
    0
  );
  const target = baseline + EXTRA_TILES;

  const tiles: Tile[] = [];
  let round = 0;

  while (tiles.length < target) {
    let added = false;
    for (const pool of pools) {
      const file = pool.files[round];
      if (!file) {
        continue;
      }
      tiles.push(makeTile(pool.brandFolder, file));
      added = true;
      if (tiles.length >= target) {
        break;
      }
    }
    if (!added) {
      break;
    }
    round += 1;
  }

  return tiles;
}

let tilesPromise: Promise<Tile[]> | null = null;

async function getTiles() {
  if (!tilesPromise) {
    tilesPromise = loadTiles();
  }
  return tilesPromise;
}

export async function MaterialsStrip() {
  const tiles = await getTiles();
  const doubled = [...tiles, ...tiles];
  const preloadUrls = tiles.map((tile) => tile.src);
  for (const src of preloadUrls) {
    preload(src, { as: "image", fetchPriority: "low" });
  }

  return (
    <section className="materials-strip home-flow-section">
      <MaterialsStripPreload urls={preloadUrls} />
      <div className="container">
        <div className="materials-strip__head">
          <h2 className="materials-strip__title">
            13 брендов кварцевого агломерата — найдите свой оттенок
          </h2>
          <p className="materials-strip__sub">
            Образцы в наличии. Подбираем декор под интерьер и бюджет.
          </p>
        </div>
      </div>

      <p className="materials-strip__scroll-hint">Листайте образцы →</p>
      <div className="materials-strip__rail" role="list" aria-label="Образцы камня">
        <div className="materials-track">
          {doubled.map((tile, i) => (
            <Link
              key={`${tile.brandFolder}/${tile.src}-${i}`}
              href={brandCatalogHref(stoneBrandFolderToSlug(tile.brandFolder))}
              className="materials-strip__tile"
              role="listitem"
              aria-label={tile.alt}
              tabIndex={i >= tiles.length ? -1 : 0}
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                width={156}
                height={104}
                sizes="156px"
                loading="eager"
                priority={i < 14}
                style={{ objectFit: "cover" }}
              />
              <span className="materials-strip__brand">{tile.brand}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="materials-strip__cta">
          <Link href="/catalog-kamnya" className="button-secondary">
            Весь каталог камня →
          </Link>
        </div>
      </div>
    </section>
  );
}
