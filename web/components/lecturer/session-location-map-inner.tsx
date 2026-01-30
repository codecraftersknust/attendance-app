"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useMapEvents, useMap } from "react-leaflet";
import L, { type LeafletMouseEvent } from "leaflet";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

type SessionLocation = { lat: number; lng: number; radiusMeters?: number };

// Fix default marker icon in Next.js (Leaflet's default paths break with bundling)
const createDefaultIcon = () =>
    L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

function MapClickHandler({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapCenterUpdater({
    center,
    zoom,
    value,
}: {
    center: [number, number];
    zoom: number;
    value: SessionLocation | null;
}) {
    const map = useMap();
    const target = value ? ([value.lat, value.lng] as [number, number]) : center;
    useEffect(() => {
        map.setView(target, zoom);
    }, [map, target[0], target[1], zoom]);
    return null;
}

type Props = {
    center: [number, number];
    zoom: number;
    value: SessionLocation | null;
    onMapClick: (lat: number, lng: number) => void;
};

export function SessionLocationMapInner({ center, zoom, value, onMapClick }: Props) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className="h-[280px] w-full z-0"
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={onMapClick} />
            <MapCenterUpdater center={center} zoom={zoom} value={value} />
            {value && (
                <>
                    <Marker
                        position={[value.lat, value.lng]}
                        icon={createDefaultIcon()}
                        eventHandlers={{ click: () => { } }}
                    />
                    {(value.radiusMeters ?? 100) > 0 && (
                        <Circle
                            center={[value.lat, value.lng]}
                            radius={value.radiusMeters ?? 100}
                            pathOptions={{ color: "#047857", fillColor: "#059669", fillOpacity: 0.15, weight: 2 }}
                        />
                    )}
                </>
            )}
        </MapContainer>
    );
}
