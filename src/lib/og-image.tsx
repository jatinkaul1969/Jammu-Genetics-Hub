// Shared visual for the site-wide social share card (opengraph-image.tsx /
// twitter-image.tsx) — generated at build time via next/og, so no external
// logo asset is needed. Kept deliberately simple: satori (the renderer
// behind ImageResponse) only supports a subset of CSS/flexbox.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function BrandCard({ subtitle }: { subtitle?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0b6e5c 0%, #063f34 100%)",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 140,
          height: 140,
          borderRadius: 28,
          background: "rgba(255,255,255,0.14)",
          color: "#ffffff",
          fontSize: 56,
          fontWeight: 700,
          marginBottom: 40,
        }}
      >
        JGH
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        Jammu Genetics Hub
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 24,
          fontSize: 30,
          color: "#d7ece6",
          textAlign: "center",
          maxWidth: 920,
        }}
      >
        {subtitle ?? "Compare lab test prices · Free home sample collection in Jammu & Mumbai"}
      </div>
    </div>
  );
}
