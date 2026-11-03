import QRCode from "qrcode";

/** A QR code as an SVG data URI (renders crisply at any size). */
export async function qrDataUri(url: string, dark = "#063f34", light = "#ffffff") {
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
