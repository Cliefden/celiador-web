import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0e0e13",
          borderRadius: 8,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7c6bff" />
              <stop offset="1" stopColor="#26d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M22 12a7 7 0 1 0 0 8"
            fill="none"
            stroke="url(#g)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
