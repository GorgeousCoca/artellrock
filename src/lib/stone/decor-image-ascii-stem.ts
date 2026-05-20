/**
 * Имя файла для декора в `public/images/...`: только ASCII [a-z0-9-].
 * Кириллица транслитерируется (стабильные URL, Docker/CDN, `/_next/image`).
 */
const CYR_TO_LAT: Record<string, string> = {
  А: "A",
  а: "a",
  Б: "B",
  б: "b",
  В: "V",
  в: "v",
  Г: "G",
  г: "g",
  Д: "D",
  д: "d",
  Е: "E",
  е: "e",
  Ё: "Yo",
  ё: "yo",
  Ж: "Zh",
  ж: "zh",
  З: "Z",
  з: "z",
  И: "I",
  и: "i",
  Й: "Y",
  й: "y",
  К: "K",
  к: "k",
  Л: "L",
  л: "l",
  М: "M",
  м: "m",
  Н: "N",
  н: "n",
  О: "O",
  о: "o",
  П: "P",
  п: "p",
  Р: "R",
  р: "r",
  С: "S",
  с: "s",
  Т: "T",
  т: "t",
  У: "U",
  у: "u",
  Ф: "F",
  ф: "f",
  Х: "Kh",
  х: "kh",
  Ц: "Ts",
  ц: "ts",
  Ч: "Ch",
  ч: "ch",
  Ш: "Sh",
  ш: "sh",
  Щ: "Sch",
  щ: "sch",
  Ъ: "",
  ъ: "",
  Ы: "Y",
  ы: "y",
  Ь: "",
  ь: "",
  Э: "E",
  э: "e",
  Ю: "Yu",
  ю: "yu",
  Я: "Ya",
  я: "ya",
  І: "I",
  і: "i",
  Ї: "Yi",
  ї: "yi",
  Є: "Ye",
  є: "ye",
  Ґ: "G",
  ґ: "g",
  // часто встречающиеся символы вместо латиницы
  "–": "-",
  "—": "-",
  "−": "-",
  "‑": "-"
};

export function decorImageAsciiStem(original: string): string {
  const trimmed = original.trim();
  /** Только при наличии кириллицы нормализуем имя файла; иначе сохраняем исходное (латиница, пробелы, регистр). */
  if (!/[\u0400-\u04FF]/.test(trimmed)) {
    return trimmed;
  }
  let s = "";
  for (const ch of trimmed) {
    s += CYR_TO_LAT[ch] ?? ch;
  }
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return s.length > 0 ? s : "image";
}
