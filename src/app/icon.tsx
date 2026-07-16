import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/google-font";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
        borderRadius: 6,
        fontFamily: "Space Grotesk",
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 700, color: "#d4a94a" }}>K</span>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    },
  );
}
