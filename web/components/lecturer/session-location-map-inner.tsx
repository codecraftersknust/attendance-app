"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useMapEvents, useMap } from "react-leaflet";
import L, { type LeafletMouseEvent } from "leaflet";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

type SessionLocation = { lat: number; lng: number; radiusMeters?: number };

const DEFAULT_RADIUS_M = 100;

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

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapMoveHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
    const map = useMap();
    useMapEvents({
        moveend() {
            const center = map.getCenter();
            onPositionChange(center.lat, center.lng);
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
    onPositionChange: (lat: number, lng: number) => void;
};

export function SessionLocationMapInner({ center, zoom, value, onPositionChange }: Props) {
    const position = value ? [value.lat, value.lng] as [number, number] : center;
    const radius = value?.radiusMeters ?? DEFAULT_RADIUS_M;

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
            <MapClickHandler onPositionChange={onPositionChange} />
            <MapMoveHandler onPositionChange={onPositionChange} />
            <MapCenterUpdater center={center} zoom={zoom} value={value} />
            <Marker
                position={position}
                icon={createDefaultIcon()}
                draggable
                eventHandlers={{
                    dragend(e) {
                        const marker = e.target;
                        const { lat, lng } = marker.getLatLng();
                        onPositionChange(lat, lng);
                    },
                }}
            />
            {radius > 0 && (
                <Circle
                    center={position}
                    radius={radius}
                    pathOptions={{ color: "#047857", fillColor: "#059669", fillOpacity: 0.15, weight: 2 }}
                />
            )}
        </MapContainer>
    );
}
