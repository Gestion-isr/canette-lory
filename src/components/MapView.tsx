"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  number?: number | string;
  color?: string;
  popup?: React.ReactNode;
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
};

export type MapViewProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  home?: { lat: number; lng: number };
  routeLine?: [number, number][];
  /** Trait plein (vrai trajet routier) au lieu de pointillés (vol d'oiseau) */
  solidLine?: boolean;
  onClick?: (lat: number, lng: number) => void;
  fitToMarkers?: boolean;
  className?: string;
};

function pinIcon(color: string, label?: string | number) {
  return L.divIcon({
    className: "leaflet-div-icon",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
    html: `<div style="position:relative;width:32px;height:40px">
      <svg width="32" height="40" viewBox="0 0 32 40" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 10.5 16 24 16 24s16-13.5 16-24C32 7.2 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="10" fill="white"/>
      </svg>
      <div style="position:absolute;top:8px;left:0;width:32px;text-align:center;font:700 13px/16px system-ui;color:#1f2937">${label ?? ""}</div>
    </div>`,
  });
}

const homeIcon = L.divIcon({
  className: "leaflet-div-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px">🏠</div>`,
});

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 15));
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function MapView({
  center,
  zoom = 14,
  markers = [],
  home,
  routeLine,
  solidLine = false,
  onClick,
  fitToMarkers = false,
  className = "h-80 w-full",
}: MapViewProps) {
  const fitPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = markers.map((m) => [m.lat, m.lng]);
    if (home) pts.push([home.lat, home.lng]);
    return pts;
  }, [markers, home]);

  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={onClick} />
        {fitToMarkers && <FitBounds points={fitPoints} />}
        {routeLine && routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#db2777", weight: 5, opacity: 0.85, dashArray: solidLine ? undefined : "8 6" }}
          />
        )}
        {home && (
          <Marker position={[home.lat, home.lng]} icon={homeIcon}>
            <Popup>Point de départ</Popup>
          </Marker>
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={pinIcon(m.color ?? "#db2777", m.number)}
            draggable={m.draggable}
            eventHandlers={
              m.onDragEnd
                ? {
                    dragend(e) {
                      const ll = (e.target as L.Marker).getLatLng();
                      m.onDragEnd?.(ll.lat, ll.lng);
                    },
                  }
                : undefined
            }
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
