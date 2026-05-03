"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Default map center (Bangalore area — adjust for your campus). */
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

export type LocationMapPickerProps = {
  label: string;
  value: string;
  onChange: (address: string) => void;
  required?: boolean;
};

export function LocationMapPicker({ label, value, onChange, required }: LocationMapPickerProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const geoapifyKey =
    typeof process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY === "string"
      ? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      : "";
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [useOsmPreview, setUseOsmPreview] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!geoapifyKey || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const endpoint =
          "https://api.geoapify.com/v1/geocode/autocomplete?text=" +
          encodeURIComponent(query) +
          `&apiKey=${geoapifyKey}&limit=5`;
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) {
          setGeoError("Geoapify search failed. Check API key and permissions.");
          return;
        }
        const data = (await res.json()) as {
          features?: Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: { formatted?: string };
          }>;
        };
        const next = (data.features ?? [])
          .map((f) => {
            const center = f.geometry?.coordinates;
            const placeName = f.properties?.formatted;
            if (!center || !placeName) return null;
            return { place_name: placeName, center };
          })
          .filter((x): x is { place_name: string; center: [number, number] } => Boolean(x));
        setSuggestions(next);
        setGeoError("");
      } catch {
        // ignore transient search failures
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [geoapifyKey, query]);

  const staticPreviewUrl = useMemo(() => {
    if (!geoapifyKey) return "";
    const lng = coords?.lng ?? DEFAULT_CENTER.lng;
    const lat = coords?.lat ?? DEFAULT_CENTER.lat;
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=900&height=300&center=lonlat:${lng},${lat}&zoom=14&marker=lonlat:${lng},${lat};color:%23285A98;size:medium&apiKey=${geoapifyKey}`;
  }, [coords, geoapifyKey]);

  const osmEmbedUrl = useMemo(() => {
    const lng = coords?.lng ?? DEFAULT_CENTER.lng;
    const lat = coords?.lat ?? DEFAULT_CENTER.lat;
    const delta = 0.01;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [coords]);

  if (!geoapifyKey) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="Set NEXT_PUBLIC_GEOAPIFY_API_KEY for map picker"
        />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Add <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">NEXT_PUBLIC_GEOAPIFY_API_KEY</code> inside{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">.env.local</code> to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChangeRef.current(next);
        }}
        placeholder="Search location with Geoapify…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        autoComplete="off"
      />
      {isLoading && <p className="text-xs text-slate-500">Searching…</p>}
      {geoError && <p className="text-xs text-red-600 dark:text-red-400">{geoError}</p>}
      {suggestions.length > 0 && (
        <ul className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {suggestions.map((item) => (
            <li key={`${item.place_name}-${item.center[0]}-${item.center[1]}`}>
              <button
                type="button"
                onClick={() => {
                  setQuery(item.place_name);
                  onChangeRef.current(item.place_name);
                  setCoords({ lng: item.center[0], lat: item.center[1] });
                  setUseOsmPreview(false);
                  setSuggestions([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {item.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
        {useOsmPreview ? (
          <iframe
            title="OpenStreetMap preview"
            src={osmEmbedUrl}
            className="w-full h-52"
            loading="lazy"
          />
        ) : (
          <img
            src={staticPreviewUrl}
            alt="Geoapify preview"
            className="w-full h-52 object-cover"
            onError={() => {
              setGeoError("Geoapify preview unavailable; using OpenStreetMap preview.");
              setUseOsmPreview(true);
            }}
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Selected address</span>
        <textarea
          className="w-full min-h-[3rem] rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={2}
          placeholder="Choose on the map or search above…"
        />
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Search via Geoapify and pick a suggestion, then edit text if needed.
        </p>
      </div>
    </div>
  );
}
