"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Locate, X, Search } from "lucide-react";

export type SessionLocation = { lat: number; lng: number; radiusMeters?: number };

const DEFAULT_RADIUS_M = 100;
const MIN_RADIUS_M = 1;
const MAX_RADIUS_M = 10000;

// KNUST main campus, Kumasi, Ghana
const KNUST_CENTER: [number, number] = [6.6884, -1.6164];
const KNUST_ZOOM = 16;

type SessionLocationMapProps = {
    value: SessionLocation | null;
    onChange: (location: SessionLocation | null) => void;
};

type NominatimResult = {
    lat: string;
    lon: string;
    display_name: string;
    type?: string;
};

export function SessionLocationMap({ value, onChange }: SessionLocationMapProps) {
    const [center, setCenter] = useState<[number, number]>(KNUST_CENTER);
    const [zoom, setZoom] = useState(KNUST_ZOOM);
    const [locating, setLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [searching, setSearching] = useState(false);
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
        setCenter(KNUST_CENTER);
        setZoom(KNUST_ZOOM);
    }, [onChange]);

    const handleSearch = useCallback(async () => {
        const q = searchQuery.trim();
        if (!q) return;
        setSearching(true);
        setSearchResults([]);
        try {
            const query = encodeURIComponent(`${q}, KNUST, Kumasi, Ghana`);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`,
                {
                    headers: {
                        "Accept-Language": "en",
                        "User-Agent": "AbsenseAttendanceApp/1.0 (lecturer location search)",
                    },
                }
            );
            const data: NominatimResult[] = await res.json();
            setSearchResults(data);
            if (data.length > 0) {
                const first = data[0];
                const lat = parseFloat(first.lat);
                const lng = parseFloat(first.lon);
                setCenter([lat, lng]);
                setZoom(18);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    const handleSelectResult = useCallback(
        (result: NominatimResult) => {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            onChange({ lat, lng, radiusMeters: value?.radiusMeters ?? DEFAULT_RADIUS_M });
            setCenter([lat, lng]);
            setZoom(18);
            setSearchResults([]);
            setSearchQuery("");
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
                Optional: set where the class is held and the allowed radius. Students must be within this radius to be marked present.
            </p>
            <p className="text-xs text-gray-500">
                Map is centered on KNUST. Search for a building (e.g. &quot;Engineering&quot;, &quot;Great Hall&quot;, &quot;CCB&quot;) or use your location.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search building or place at KNUST..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="gap-1.5 shrink-0"
                >
                    {searching ? "Searching…" : "Search"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="gap-1.5 shrink-0"
                >
                    <Locate className="h-4 w-4" />
                    {locating ? "Getting…" : "My location"}
                </Button>
                {value && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-gray-600 shrink-0">
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>
            {searchResults.length > 0 && (
                <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white max-h-40 overflow-y-auto">
                    {searchResults.map((r, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                onClick={() => handleSelectResult(r)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-start gap-2"
                            >
                                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-gray-700">{r.display_name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
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
