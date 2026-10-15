import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const runtime = "edge";
export const alt = site.tagline;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#08080a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(124, 107, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(38, 211, 238, 0.15) 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              background: "linear-gradient(135deg, #7c6bff 0%, #26d3ee 100%)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              fontSize: 42,
              color: "#f8fafc",
              marginTop: 24,
              maxWidth: 900,
              textAlign: "center",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {site.tagline}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#94a3b8",
              marginTop: 24,
              maxWidth: 800,
              textAlign: "center",
            }}
          >
            A native macOS AI code editor built on VS Code
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
