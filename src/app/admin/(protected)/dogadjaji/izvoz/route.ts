import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listAllEventsForExport } from "@/lib/admin-events";
import { stringifyCsv } from "@/lib/csv";
import { utcIsoToZagrebLocalInput, todayInZagreb } from "@/lib/zagreb-time";

// Isti redoslijed stupaca kao dokumentacija na /admin/dogadjaji/uvoz — datoteka
// mora biti izravno ponovno uvoziva istim putem (`importCsv`).
const COLUMNS = [
  "title",
  "category_slug",
  "location_slug",
  "start_at",
  "image_url",
  "description",
  "venue_name",
  "end_at",
  "organizer_name",
  "organizer_contact",
  "source_url",
  "status",
  "is_free",
  "is_family_friendly",
  "is_dog_friendly",
  "is_solo_friendly",
  "is_romantic",
  "is_hidden_gem",
];

/**
 * Route handleri NE prolaze kroz `(protected)/layout.tsx` (layout omata
 * samo stranice, ne route handlere) — provjera sesije mora biti ovdje,
 * izravno, isti "obrana u dubinu" princip kao ostatak admina (ADR-007).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautorizirano." }, { status: 401 });
  }

  const events = await listAllEventsForExport();

  const rows = [
    COLUMNS,
    ...events.map((event) =>
      COLUMNS.map((column) => {
        const value = event[column as keyof typeof event];
        if (typeof value === "boolean") return value ? "true" : "false";
        if (column === "start_at" || column === "end_at") {
          return value ? utcIsoToZagrebLocalInput(value as string) : "";
        }
        return value ?? "";
      }),
    ),
  ];

  const csv = "﻿" + stringifyCsv(rows);
  const filename = `kam-denes-dogadjaji-${todayInZagreb()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
