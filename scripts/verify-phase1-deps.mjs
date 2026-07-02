/**
 * STAB-01: prove framer-motion is absent from ArtellRock 2.0 dependency graph and source.
 * Exit 0 = PASS, non-zero = FAIL.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TARGET = "framer-motion";

const SCAN_DIRS = ["src", "scripts"];
const CONFIG_FILES = ["next.config.ts", "next.config.mjs", "next.config.js"];

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

const SELF_BASE = path.basename(fileURLToPath(import.meta.url));

function scanDir(dir, hits) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return;

  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name), hits);
      continue;
    }
    if (entry.name === SELF_BASE) {
      continue;
    }
    const text = readText(full);
    if (text && text.includes(TARGET)) {
      hits.push(path.relative(ROOT, full));
    }
  }
}

function scanConfigRoots(hits) {
  for (const name of CONFIG_FILES) {
    const full = path.join(ROOT, name);
    const text = readText(full);
    if (text && text.includes(TARGET)) {
      hits.push(name);
    }
  }

  for (const name of fs.readdirSync(ROOT)) {
    if (/^eslint\.config\./i.test(name)) {
      const full = path.join(ROOT, name);
      const text = readText(full);
      if (text && text.includes(TARGET)) {
        hits.push(name);
      }
    }
  }
}

function checkPackageJson(hits) {
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const deps = pkg[section];
    if (deps && Object.prototype.hasOwnProperty.call(deps, TARGET)) {
      hits.push(`package.json (${section})`);
    }
  }
}

function main() {
  const hits = [];
  checkPackageJson(hits);

  for (const dir of SCAN_DIRS) {
    scanDir(dir, hits);
  }
  scanConfigRoots(hits);

  if (hits.length === 0) {
    console.log(`PASS: ${TARGET} not found in ArtellRock 2.0`);
    process.exit(0);
  }

  console.error(`FAIL: ${TARGET} found in:`);
  for (const h of hits) {
    console.error(`  - ${h}`);
  }
  process.exit(1);
}

main();
