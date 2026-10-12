import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Računsko pitanje za /prijavi-dogadaj, ojačano bez vanjske usluge
 * (sigurnosni audit 2026-07-21, otvorena stavka "captcha bez kriptografskog
 * potpisa"; zatvoreno 2026-10-13). Ranije su oba pribrojnika bila u
 * skrivenim poljima forme — bot ih je mogao pročitati ili podmetnuti
 * vlastite (npr. 0 + 0 = 0). Sad:
 *  - pribrojnici + vrijeme izdavanja idu u HMAC-potpisan žeton (ne mogu se
 *    krivotvoriti), žeton vrijedi TOKEN_TTL_MS;
 *  - forma poslana brže od MIN_FILL_MS se odbija (čovjek ne stigne);
 *  - honeypot polje rješava se u server akciji (vidi actions.ts).
 * Pitanje je i dalje čitljivo botu koji parsira label — ovo nije zamjena za
 * pravu captchu, nego podiže cijenu napada; pravi strop je DB rate limit
 * (0020_public_submission_rate_limit.sql).
 *
 * Tajna: postojeći VISITOR_HASH_SECRET s domenskim prefiksom "captcha:"
 * (bez nove env varijable u Vercelu; različita namjena → različit HMAC
 * ključ, pa se vrijednosti ne mogu prenijeti između brojača i captche).
 */
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const MIN_FILL_MS = 3000;

function sign(payload: string): string {
  return createHmac("sha256", `captcha:${process.env.VISITOR_HASH_SECRET}`)
    .update(payload)
    .digest("base64url");
}

export function createCaptcha(): { question: string; token: string } {
  const a = randomInt(1, 11);
  const b = randomInt(1, 11);
  const payload = `${a}.${b}.${Date.now()}`;
  return { question: `${a} + ${b}`, token: `${payload}.${sign(payload)}` };
}

export type CaptchaResult = "ok" | "wrong" | "expired" | "too_fast" | "invalid";

export function verifyCaptcha(token: string, answer: string): CaptchaResult {
  const parts = token.split(".");
  if (parts.length !== 4) return "invalid";

  const [a, b, issuedAt, signature] = parts;
  const expected = Buffer.from(sign(`${a}.${b}.${issuedAt}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return "invalid";
  }

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age > TOKEN_TTL_MS) return "expired";
  if (age < MIN_FILL_MS) return "too_fast";

  return Number(answer) === Number(a) + Number(b) ? "ok" : "wrong";
}
