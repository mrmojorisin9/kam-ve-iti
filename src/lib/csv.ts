/**
 * Minimalni RFC4180 CSV parser bez vanjske ovisnosti (namjerno — vidi
 * DECISIONS.md ADR-006 duh: ne uvoditi biblioteku bez razloga za problem
 * ove veličine). Podržava navodnike s ugniježđenim zarezima/prijelomima
 * retka i escapean navodnik (""), te CRLF i LF završetke redaka.
 */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === delimiter) {
      pushField();
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Excel s hrvatskim/EU regionalnim postavkama izvozi CSV sa `;` umjesto
 * `,` (jer je zarez decimalni separator). Detekcija po zaglavlju pokriva
 * oba slučaja bez da admin mora ručno birati format.
 */
export function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

export function stripBom(text: string): string {
  return text.replace(/^﻿/, "");
}
