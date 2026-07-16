import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/google-font";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await loadGoogleFont("Space Grotesk", "K");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1e2b22",
        fontFamily: "Space Grotesk",
      }}
    >
      <span style={{ fontSize: 110, fontWeight: 700, color: "#d4a94a" }}>
        K
      </span>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    },
  );
}
