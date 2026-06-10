"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Locate, X } from "lucide-react";

export type SessionLocation = { lat: number; lng: number; radiusMeters?: number };

const DEFAULT_RADIUS_M = 100;
const MIN_RADIUS_M = 1;
const MAX_RADIUS_M = 10000;

// College of Engineering, KNUST, Kumasi, Ghana
const KNUST_CENTER: [number, number] = [6.67338, -1.56561];
const KNUST_ZOOM = 17;

type SessionLocationMapProps = {
    value: SessionLocation | null;
    onChange: (location: SessionLocation | null) => void;
};

const clampRadius = (n: number) => Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, n));

export function SessionLocationMap({ value, onChange }: SessionLocationMapProps) {
    const [center, setCenter] = useState<[number, number]>(KNUST_CENTER);

    // Local text state so the radius box can be cleared while typing; the
    // numeric value is only committed when the text parses to a number
    const [radiusText, setRadiusText] = useState<string>(String(value?.radiusMeters ?? DEFAULT_RADIUS_M));
    const lastCommittedRadius = useRef<number | undefined>(value?.radiusMeters);

    useEffect(() => {
        // Sync only on external changes (e.g. location cleared and re-set),
        // not on echoes of values we just committed ourselves
        const external = value?.radiusMeters;
        if (external != null && external !== lastCommittedRadius.current) {
            lastCommittedRadius.current = external;
            setRadiusText(String(external));
        }
    }, [value?.radiusMeters]);
    const [zoom, setZoom] = useState(KNUST_ZOOM);
    const [locating, setLocating] = useState(false);
    const [MapContent, setMapContent] = useState<React.ComponentType<{
        center: [number, number];
        zoom: number;
        value: SessionLocation | null;
        onPositionChange: (lat: number, lng: number) => void;
    }> | null>(null);

    // Dynamic import to avoid SSR issues with Leaflet
    useEffect(() => {
        import("./session-location-map-inner").then((m) => setMapContent(() => m.SessionLocationMapInner));
    }, []);

    const handleUseMyLocation = useCallback(() => {
        if (!navigator.geolocation) return;
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
        setCenter(KNUST_CENTER);
        setZoom(KNUST_ZOOM);
    }, [onChange]);

    const handlePositionChange = useCallback(
        (lat: number, lng: number) => {
            onChange({ lat, lng, radiusMeters: value?.radiusMeters ?? DEFAULT_RADIUS_M });
            setCenter([lat, lng]);
        },
        [onChange, value?.radiusMeters]
    );

    if (!MapContent) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center h-64 text-gray-500">
                Loading map...
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-sm text-gray-600">
                Recommended: set where the class is held and the allowed radius. Students must be within this radius to be marked present. Sessions without location will flag attendance for lecturer review.
            </p>
            <p className="text-xs text-gray-500">
                Pan the map or drag the marker to set the class location. Use &quot;My location&quot; to jump to your current position.
            </p>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="gap-1.5"
                >
                    <Locate className="h-4 w-4" />
                    {locating ? "Getting…" : "My location"}
                </Button>
                {value && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-gray-600">
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 min-h-[280px]">
                <MapContent
                    center={center}
                    zoom={zoom}
                    value={value}
                    onPositionChange={handlePositionChange}
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
                            value={radiusText}
                            onChange={(e) => {
                                const raw = e.target.value;
                                setRadiusText(raw);
                                const n = parseInt(raw, 10);
                                if (!isNaN(n)) {
                                    const clamped = clampRadius(n);
                                    lastCommittedRadius.current = clamped;
                                    onChange({ ...value, radiusMeters: clamped });
                                }
                            }}
                            onBlur={() => {
                                const n = parseInt(radiusText, 10);
                                const final = isNaN(n)
                                    ? (value.radiusMeters ?? DEFAULT_RADIUS_M)
                                    : clampRadius(n);
                                lastCommittedRadius.current = final;
                                setRadiusText(String(final));
                                onChange({ ...value, radiusMeters: final });
                            }}
                            className="w-24 rounded border border-gray-200 px-2 py-1 text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
