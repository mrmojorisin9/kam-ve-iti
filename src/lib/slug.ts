const EXTRA_TRANSLITERATION: Record<string, string> = {
  đ: "d",
  Đ: "d",
};

/**
 * Pretvara naslov u URL-safe slug. NFD normalizacija skida većinu naglasaka
 * (č/ć/š/ž), a đ se ne raspada NFD-om pa se prevodi ručno.
 */
export function slugify(text: string): string {
  const withoutDj = text
    .split("")
    .map((char) => EXTRA_TRANSLITERATION[char] ?? char)
    .join("");

  return withoutDj
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
