/**
 * Вставить целиком в консоль Chrome (F12 → Console) на странице каталога:
 * https://agl.center/kvarcevyj-aglomerat с уже выставленными фильтрами.
 *
 * Не запускать через Node. Скрипт читает фильтры из адресной строки,
 * забирает карточки из API Tilda и по кнопке на странице пишет папку:
 *   catalog.json
 *   <бренд>/<название [артикул]>/description.txt
 *   <бренд>/<название [артикул]>/01.jpg …
 *
 * Повторный запуск пропускает уже скачанные фото. Ссылки на Rutube
 * сохраняются в описании, сами ролики не скачиваются.
 */
(() => {
  const ENDPOINT = "https://store.tildaapi.com/api/getproductslist/";
  const PAGE_SIZE = 100;
  const IMAGE_CONCURRENCY = 4;

  const scriptText = [...document.scripts].map((node) => node.textContent || "").join("\n");
  const storepart = scriptText.match(/storepart:'(\d+)'/)?.[1];
  const recid =
    document.querySelector('.t-rec[data-record-type="951"]')?.id?.replace(/^rec/, "") ||
    "425710884";

  if (!storepart) {
    console.error("Не нашёл storepart. Откройте консоль именно на странице каталога agl.center.");
    return;
  }

  const bar = document.createElement("div");
  bar.id = "agl-catalog-saver";
  bar.style.cssText = [
    "position:fixed",
    "right:16px",
    "bottom:16px",
    "z-index:2147483647",
    "display:flex",
    "flex-direction:column",
    "gap:8px",
    "width:min(360px, calc(100vw - 32px))",
    "padding:14px",
    "background:#111",
    "color:#fff",
    "border-radius:12px",
    "font:14px/1.4 Segoe UI, sans-serif",
    "box-shadow:0 10px 30px rgba(0,0,0,.35)",
  ].join(";");

  const title = document.createElement("div");
  title.textContent = "Сохранение каталога agl.center";
  title.style.fontWeight = "700";

  const status = document.createElement("div");
  status.textContent = "Нажмите кнопку и выберите пустую папку. Уже скачанные файлы будут пропущены.";
  status.style.opacity = "0.9";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Сохранить описания и фото";
  button.style.cssText = [
    "border:0",
    "border-radius:8px",
    "padding:10px 12px",
    "background:#579096",
    "color:#fff",
    "font:inherit",
    "font-weight:700",
    "cursor:pointer",
  ].join(";");

  bar.append(title, status, button);
  document.getElementById("agl-catalog-saver")?.remove();
  document.body.append(bar);

  button.addEventListener("click", () => {
    button.disabled = true;
    saveCatalog().catch((error) => {
      console.error(error);
      if (error && error.name === "AbortError") {
        status.textContent = "Выбор папки отменён.";
      } else {
        status.textContent = "Ошибка: " + (error && error.message ? error.message : error);
      }
      button.disabled = false;
    });
  });

  console.log("Кнопка «Сохранить описания и фото» появилась в правом нижнем углу страницы.");

  async function saveCatalog() {
    if (typeof showDirectoryPicker !== "function") {
      throw new Error("Нужен Chrome или Edge: Firefox не умеет выбирать папку из консоли.");
    }

    const { filters, sort } = readFilters();
    const filterNames = Object.keys(filters);
    if (!filterNames.length) {
      throw new Error("В адресе нет фильтров tfc_. Откройте ссылку каталога с брендами и обновите страницу.");
    }

    status.textContent = "Выберите папку для сохранения…";
    const root = await showDirectoryPicker({ mode: "readwrite", startIn: "downloads" });

    status.textContent = "Загружаю список камней…";
    const products = await fetchAllProducts(filters, sort, (loaded, total) => {
      status.textContent = `Список: ${loaded} из ${total}`;
    });

    const catalog = {
      source: location.href,
      savedAt: new Date().toISOString(),
      total: products.length,
      products: [],
    };

    let imageDone = 0;
    let imageTotal = 0;
    let failures = 0;
    const usedFolders = new Map();

    for (const product of products) {
      imageTotal += parseGallery(product).filter((item) => item.img).length;
    }

    for (let index = 0; index < products.length; index += 1) {
      const product = products[index];
      const record = await saveProduct(root, product, usedFolders, () => {
        imageDone += 1;
        status.textContent = `Камни ${index + 1}/${products.length} · фото ${imageDone}/${imageTotal} · ошибки ${failures}`;
      });
      failures += record.errors.length;
      status.textContent = `Камни ${index + 1}/${products.length} · фото ${imageDone}/${imageTotal} · ошибки ${failures}`;
      catalog.products.push(record);
      if ((index + 1) % 20 === 0 || index + 1 === products.length) {
        await writeText(root, "catalog.json", JSON.stringify(catalog, null, 2));
      }
    }

    status.textContent = `Готово: ${products.length} камней, фото ${imageDone}/${imageTotal}, ошибки ${failures}. Папка выбрана вами.`;
    button.disabled = false;
    console.log("Каталог сохранён", catalog);
  }

  function readFilters() {
    const filters = {};
    const sort = {};
    for (const [rawKey, rawValue] of new URLSearchParams(location.search).entries()) {
      if (!rawKey.startsWith("tfc_")) continue;
      const name = rawKey.slice(4).replace(/\[\d+\]$/, "");
      if (name === "div") continue;
      if (name === "sort") {
        const splitAt = rawValue.indexOf(":");
        if (splitAt > 0) sort[rawValue.slice(0, splitAt)] = rawValue.slice(splitAt + 1);
        continue;
      }
      const values = rawValue.split(":::").map((value) => value.trim()).filter(Boolean);
      if (values.length) filters[name] = values;
    }
    if (!Object.keys(sort).length) sort.title = "asc";
    return { filters, sort };
  }

  async function fetchAllProducts(filters, sort, onProgress) {
    const products = [];
    const seen = new Set();
    let slice = 1;

    while (slice) {
      const params = new URLSearchParams();
      params.set("storepartuid", storepart);
      params.set("recid", recid);
      params.set("slice", String(slice));
      params.set("size", String(PAGE_SIZE));
      params.set("flag_root", "withroot");
      for (const [field, direction] of Object.entries(sort)) {
        params.set(`sort[${field}]`, direction);
      }
      for (const [name, values] of Object.entries(filters)) {
        values.forEach((value, index) => params.append(`filters[${name}][${index}]`, value));
      }

      const data = await fetchJson(ENDPOINT + "?" + params.toString());
      for (const product of data.products || []) {
        if (seen.has(String(product.uid))) continue;
        seen.add(String(product.uid));
        products.push(product);
      }
      onProgress(products.length, Number(data.total) || products.length);
      if (!data.nextslice || !(data.products || []).length) break;
      if (Number(data.total) && products.length >= Number(data.total)) break;
      slice = data.nextslice;
    }

    return products;
  }

  async function saveProduct(root, product, usedFolders, onImage) {
    const brand = safeName(product.brand || "Без бренда");
    const folderName = uniqueFolder(usedFolders, brand, product);
    const brandDir = await root.getDirectoryHandle(brand, { create: true });
    const dir = await brandDir.getDirectoryHandle(folderName, { create: true });
    const characteristics = parseCharacteristics(product);
    const gallery = parseGallery(product);
    const description = htmlToText(product.text || product.descr || "");
    const videos = gallery.map((item) => item.video).filter(Boolean);
    const images = [];
    const errors = [];

    const files = gallery
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.img);

    await mapPool(files, IMAGE_CONCURRENCY, async ({ item, index }) => {
      const filename = `${String(index + 1).padStart(2, "0")}.${extensionFromUrl(item.img)}`;
      const relativePath = `${brand}/${folderName}/${filename}`;
      try {
        const existing = await fileSize(dir, filename);
        if (existing > 0) {
          images[index] = { file: relativePath, url: item.img, alt: item.alt || "" };
          onImage(1);
          return;
        }
        const blob = await fetchBlob(item.img);
        await writeBlob(dir, filename, blob);
        images[index] = { file: relativePath, url: item.img, alt: item.alt || "" };
        onImage(1);
      } catch (error) {
        errors.push({ url: item.img, message: error instanceof Error ? error.message : String(error) });
        onImage(1);
      }
    });

    const savedImages = images.filter(Boolean);
    const descriptionText = [
      `Название: ${product.title || ""}`,
      `Бренд: ${product.brand || ""}`,
      `Артикул: ${product.sku || ""}`,
      `Ссылка: ${product.url || ""}`,
      "",
      "Характеристики:",
      ...(characteristics.length
        ? characteristics.map((item) => `- ${item.title}: ${item.value}`)
        : ["- нет"]),
      "",
      "Описание:",
      description || "нет текста",
      "",
      "Видео:",
      ...(videos.length ? videos.map((url) => `- ${url}`) : ["- нет"]),
      "",
    ].join("\n");

    await writeText(dir, "description.txt", descriptionText);

    return {
      uid: product.uid,
      title: product.title || "",
      brand: product.brand || "",
      sku: product.sku || "",
      url: product.url || "",
      description,
      characteristics,
      images: savedImages,
      videos,
      errors,
      folder: `${brand}/${folderName}`,
    };
  }

  function uniqueFolder(usedFolders, brand, product) {
    const sku = safeName(product.sku || "");
    const base = safeName(product.title || sku || product.uid);
    let name = (sku ? `${base} [${sku}]` : base).slice(0, 110);
    const bucket = usedFolders.get(brand) || new Set();
    usedFolders.set(brand, bucket);
    if (bucket.has(name.toLowerCase())) {
      const suffix = ` ${product.uid}`;
      name = name.slice(0, 110 - suffix.length) + suffix;
    }
    bucket.add(name.toLowerCase());
    return name;
  }

  function parseGallery(product) {
    try {
      const value = typeof product.gallery === "string" ? JSON.parse(product.gallery || "[]") : product.gallery;
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function parseCharacteristics(product) {
    try {
      const value =
        typeof product.characteristics === "string"
          ? JSON.parse(product.characteristics || "[]")
          : product.characteristics;
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => ({ title: String(item.title || "").trim(), value: String(item.value || "").trim() }))
        .filter((item) => item.title || item.value);
    } catch {
      return [];
    }
  }

  function htmlToText(html) {
    const node = document.createElement("div");
    node.innerHTML = String(html).replace(/<br\s*\/?>/gi, "\n");
    return (node.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function safeName(value) {
    return String(value)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "")
      .slice(0, 90) || "item";
  }

  function extensionFromUrl(url) {
    const match = new URL(url, location.href).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : "jpg";
  }

  async function mapPool(items, limit, worker) {
    let cursor = 0;
    async function run() {
      while (cursor < items.length) {
        const current = cursor;
        cursor += 1;
        await worker(items[current], current);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) || 0 }, run));
  }

  async function fetchJson(url) {
    return fetchWithRetry(url, async (response) => response.json());
  }

  async function fetchBlob(url) {
    return fetchWithRetry(url, async (response) => {
      const blob = await response.blob();
      if (!blob.size) throw new Error("пустой файл");
      return blob;
    });
  }

  async function fetchWithRetry(url, read) {
    let lastError;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await read(response);
      } catch (error) {
        lastError = error;
        await sleep(600 * (attempt + 1));
      }
    }
    throw lastError;
  }

  async function fileSize(dir, name) {
    try {
      const handle = await dir.getFileHandle(name);
      const file = await handle.getFile();
      return file.size;
    } catch {
      return 0;
    }
  }

  async function writeText(dir, name, text) {
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function writeBlob(dir, name, blob) {
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
