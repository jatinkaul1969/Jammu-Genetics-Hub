import { ImageResponse } from "next/og";
import { BrandCard, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Jammu Genetics Hub — compare lab test prices, book home sample collection";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<BrandCard />, size);
}
