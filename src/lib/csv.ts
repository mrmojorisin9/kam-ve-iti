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

/**
 * RFC4180 escaping za jedno polje pri izvozu — obrat od `parseCsv`. Polje se
 * navodnicima omata samo kad sadrži razdjelnik, navodnik ili prijelom retka
 * (standardno pravilo, izbjegava nepotrebno "zaprljati" jednostavne
 * vrijednosti), s internim navodnicima udvostručenim (`"` → `""`).
 */
function toCsvField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Gradi CSV tekst iz redaka (prvi red zaglavlje). CRLF završeci redaka
 * (RFC4180 standard, Excel to očekuje) i `,` razdjelnik — izvezena datoteka
 * mora biti čitljiva istim uvoznim putem (`detectDelimiter`/`parseCsv`) koji
 * već podržava i `;`, ali izvoz namjerno bira `,` kao kanonski oblik.
 */
export function stringifyCsv(rows: string[][]): string {
  const delimiter = ",";
  return rows
    .map((row) => row.map((field) => toCsvField(field, delimiter)).join(delimiter))
    .join("\r\n");
}
