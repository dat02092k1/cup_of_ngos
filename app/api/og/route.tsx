import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/utils/site";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || siteConfig.name).slice(0, 200);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a0a0a",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6, display: "flex" }}>
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: "90%",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 24, opacity: 0.6, display: "flex" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
