/**
 * Fetches a Google Font as ttf/otf binary data for use with next/og
 * ImageResponse (which only supports ttf/otf/woff, not woff2). Requesting
 * without a browser User-Agent makes the Google Fonts CSS API respond with
 * a ttf/otf face instead of woff2.
 */
export async function loadGoogleFont(
  family: string,
  text: string,
  weight = 700,
) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const fontUrl = css.match(
    /src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/,
  )?.[1];
  if (!fontUrl) throw new Error(`${family} font URL not found`);
  return (await fetch(fontUrl)).arrayBuffer();
}
