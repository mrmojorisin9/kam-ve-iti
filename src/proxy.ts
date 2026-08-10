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
 * Osvježava Supabase session cookie na svaki zahtjev prema /admin i štiti
 * te rute od neautenticiranog pristupa (optimistic check — vidi ADR-007;
 * stvarna provjera se ponavlja u admin layoutu, blizu podataka).
 */
export async function proxy(request: NextRequest) {
  if (BLOCKED_USER_AGENT.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse("Nije dopušteno.", { status: 403 });
  }

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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

  return response;
}

export const config = {
  // Prošireno s "/admin/:path*" na gotovo sve rute (bot-check treba
  // pokrivati javne stranice, ne samo admin) — izuzeti su statični
  // asseti gdje middleware nema smisla.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image).*)",
  ],
};
