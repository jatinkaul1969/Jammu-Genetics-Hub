"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const destIcon = L.divIcon({
  className: "",
  html: `<svg width="26" height="36" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#0b6e5c"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [26, 36],
  iconAnchor: [13, 36],
});

const phleboIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="13" fill="#d1521f" stroke="white" stroke-width="3"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function TrackingMapInner({
  destLat,
  destLng,
  phleboLat,
  phleboLng,
}: {
  destLat: number;
  destLng: number;
  phleboLat: number | null;
  phleboLng: number | null;
}) {
  const hasPhlebo = phleboLat !== null && phleboLng !== null;
  const center: [number, number] = hasPhlebo
    ? [(destLat + phleboLat) / 2, (destLng + phleboLng) / 2]
    : [destLat, destLng];

  return (
    <MapContainer
      center={center}
      zoom={hasPhlebo ? 13 : 15}
      style={{ height: "220px", width: "100%", borderRadius: "0.5rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[destLat, destLng]} icon={destIcon} />
      {hasPhlebo && <Marker position={[phleboLat, phleboLng]} icon={phleboIcon} />}
    </MapContainer>
  );
}
