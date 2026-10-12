import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LOGIN_PATH = "/admin/login";

// Preventivna, ne 100%-tna zaštita od scrapanja (korisnikov zahtjev) —
// generički scraping alati/HTTP-klijenti koji se ne trude lažirati pravi
// browser User-Agent (najčešći "osnovni" slučaj). Sofisticiraniji
// scraperi koji koriste stvaran browser UA prolaze — očekivano.
// AI-trening crawleri (GPTBot, CCBot i sl.) NAMJERNO nisu na popisu
// (korisnikova odluka, odvojena od ovoga). Isti imenovani SEO-bot popis
// kao robots.txt, za one koji robots.txt ignoriraju.
const BLOCKED_USER_AGENT = new RegExp(
  [
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "DotBot",
    "BLEXBot",
    "PetalBot",
    "DataForSeoBot",
    "python-requests",
    "Scrapy",
    "curl/",
    "Wget",
    "HTTrack",
    "Go-http-client",
    "node-fetch",
    "okhttp",
    "axios/",
    "libwww-perl",
  ].join("|"),
  "i",
);

/**
 * Stroga CSP za skripte (sigurnosni audit 2026-07-21, ADR-018 "poznat
 * sljedeći korak"; zatvoreno 2026-10-13): jednokratni nonce po zahtjevu,
 * Next.js ga sam dodaje svojim skriptama (čita ga iz CSP zaglavlja zahtjeva
 * — node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * Namjerno ograničava SAMO skripte (+ object/base/form/frame) — slike,
 * stilovi i fetch prema Supabaseu/Resendu ostaju neograničeni (manji
 * dobitak, veći rizik loma). Sve stranice su već dinamičke (ƒ), pa nonce ne
 * mijenja način renderiranja.
 *
 * NE vrijedi za /pdf (samostalni PDF uređivač: inline skripte + pdf.js
 * `eval`/`new Function`), /api i statične datoteke (putanje s točkom) —
 * one zadržavaju blaži CSP iz next.config.ts.
 */
function buildScriptCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function needsScriptCsp(pathname: string): boolean {
  if (pathname === "/pdf" || pathname.startsWith("/api/")) return false;
  const lastSegment = pathname.split("/").pop() ?? "";
  return !lastSegment.includes(".");
}

/**
 * Osvježava Supabase session cookie na svaki zahtjev prema /admin i štiti
 * te rute od neautenticiranog pristupa (optimistic check — vidi ADR-007;
 * stvarna provjera se ponavlja u admin layoutu, blizu podataka).
 */
export async function proxy(request: NextRequest) {
  if (BLOCKED_USER_AGENT.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse("Nije dopušteno.", { status: 403 });
  }

  const { pathname } = request.nextUrl;

  const csp = needsScriptCsp(pathname)
    ? buildScriptCsp(Buffer.from(crypto.randomUUID()).toString("base64"))
    : null;
  const requestHeaders = new Headers(request.headers);
  if (csp) {
    requestHeaders.set("Content-Security-Policy", csp);
  }
  const withCsp = (response: NextResponse) => {
    if (csp) response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  if (!pathname.startsWith("/admin")) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // request.cookies.set ažurira cookie zaglavlje zahtjeva — nova
          // kopija zaglavlja nosi i osvježene kolačiće i CSP (nonce).
          const refreshedHeaders = new Headers(request.headers);
          if (csp) refreshedHeaders.set("Content-Security-Policy", csp);
          response = NextResponse.next({ request: { headers: refreshedHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname !== LOGIN_PATH && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  if (pathname === LOGIN_PATH && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return withCsp(response);
}

export const config = {
  // Prošireno s "/admin/:path*" na gotovo sve rute (bot-check treba
  // pokrivati javne stranice, ne samo admin) — izuzeti su statični
  // asseti gdje middleware nema smisla.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image).*)",
  ],
};
