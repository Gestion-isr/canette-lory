"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-gray-100" />,
});

export function Map(props: MapViewProps) {
  return <MapView {...props} />;
}
