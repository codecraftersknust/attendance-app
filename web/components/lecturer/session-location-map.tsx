"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Locate, X } from "lucide-react";

export type SessionLocation = { lat: number; lng: number; radiusMeters?: number };

const DEFAULT_RADIUS_M = 100;
const MIN_RADIUS_M = 1;
const MAX_RADIUS_M = 10000;

type SessionLocationMapProps = {
    value: SessionLocation | null;
    onChange: (location: SessionLocation | null) => void;
};

// Default center (generic) – map will try to use user location on load
const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

export function SessionLocationMap({ value, onChange }: SessionLocationMapProps) {
    const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [locating, setLocating] = useState(false);
    const [MapContent, setMapContent] = useState<React.ComponentType<{
        center: [number, number];
        zoom: number;
        value: SessionLocation | null;
        onMapClick: (lat: number, lng: number) => void;
    }> | null>(null);

    // Dynamic import to avoid SSR issues with Leaflet
    useEffect(() => {
        import("./session-location-map-inner").then((m) => setMapContent(() => m.SessionLocationMapInner));
    }, []);

    const handleUseMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                onChange({ lat, lng, radiusMeters: value?.radiusMeters ?? DEFAULT_RADIUS_M });
                setCenter([lat, lng]);
                setZoom(17);
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true }
        );
    }, [onChange, value?.radiusMeters]);

    const handleClear = useCallback(() => {
        onChange(null);
    }, [onChange]);

    if (!MapContent) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center h-64 text-gray-500">
                Loading map...
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-gray-600">
                    Optional: set where the class is held and the allowed radius. Students must be within this radius to be marked present.
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={locating}
                        className="gap-1.5"
                    >
                        <Locate className="h-4 w-4" />
                        {locating ? "Getting location…" : "Use my location"}
                    </Button>
                    {value && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-gray-600">
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 min-h-[280px]">
                <MapContent
                    center={center}
                    zoom={zoom}
                    value={value}
                    onMapClick={(lat, lng) => {
                        onChange({ lat, lng, radiusMeters: value?.radiusMeters ?? DEFAULT_RADIUS_M });
                        setCenter([lat, lng]);
                        setZoom(16);
                    }}
                />
            </div>
            {value && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="session-radius" className="text-xs text-gray-600 whitespace-nowrap">
                            Allowed radius (m):
                        </label>
                        <input
                            id="session-radius"
                            type="number"
                            min={MIN_RADIUS_M}
                            max={MAX_RADIUS_M}
                            step={10}
                            value={value.radiusMeters ?? DEFAULT_RADIUS_M}
                            onChange={(e) => {
                                const v = e.target.value ? parseInt(e.target.value, 10) : DEFAULT_RADIUS_M;
                                const clamped = Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, isNaN(v) ? DEFAULT_RADIUS_M : v));
                                onChange({ ...value, radiusMeters: clamped });
                            }}
                            className="w-24 rounded border border-gray-200 px-2 py-1 text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
