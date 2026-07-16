import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/google-font";

export const alt = "Kam denes — sva događanja u Međimurskoj županiji";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "Kam denes";
const TAGLINE = "Sva javna događanja u Međimurskoj županiji na jednom mjestu";

export default async function Image() {
  const fontData = await loadGoogleFont("Space Grotesk", TITLE + TAGLINE);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e2b22 0%, #332a1e 100%)",
        padding: "0 96px",
        fontFamily: "Space Grotesk",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 64,
          height: 4,
          background: "#d4a94a",
          marginBottom: 32,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 96,
          fontWeight: 700,
          color: "#f2e8d5",
        }}
      >
        {TITLE}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32,
          fontWeight: 700,
          color: "#a9ac9a",
          marginTop: 24,
          maxWidth: 820,
        }}
      >
        {TAGLINE}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    },
  );
}
