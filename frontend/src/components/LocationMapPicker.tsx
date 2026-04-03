"use client";

import { useEffect, useRef } from "react";

/** Default map center (Bangalore area — adjust for your campus). */
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

export type LocationMapPickerProps = {
  label: string;
  value: string;
  onChange: (address: string) => void;
  required?: boolean;
};

/**
 * Search + map: pick address via Places autocomplete, map click, or dragging the marker.
 * Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and Maps JavaScript API + Places + Geocoding enabled in Google Cloud.
 */
export function LocationMapPicker({ label, value, onChange, required }: LocationMapPickerProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const searchEl = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const mapsKey =
    typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "string"
      ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      : "";

  useEffect(() => {
    if (!mapsKey || !mapEl.current || !searchEl.current) return;

    let cancelled = false;
    const listeners: Array<{ remove: () => void }> = [];

    const init = () => {
      if (!window.google?.maps || cancelled || !mapEl.current || !searchEl.current) return;

      const map = new google.maps.Map(mapEl.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new google.maps.Marker({
        map,
        position: DEFAULT_CENTER,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      const geocoder = new google.maps.Geocoder();

      const setFromLatLng = (loc: google.maps.LatLng | google.maps.LatLngLiteral) => {
        geocoder.geocode({ location: loc }, (results, status) => {
          if (cancelled) return;
          if (status === "OK" && results?.[0]?.formatted_address) {
            onChangeRef.current(results[0].formatted_address);
          }
        });
      };

      listeners.push(
        google.maps.event.addListener(marker, "dragend", () => {
          const pos = marker.getPosition();
          if (pos) setFromLatLng(pos);
        })
      );

      listeners.push(
        google.maps.event.addListener(map, "click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            map.panTo(e.latLng);
            setFromLatLng(e.latLng);
          }
        })
      );

      const ac = new google.maps.places.Autocomplete(searchEl.current, {
        fields: ["formatted_address", "geometry", "name"],
      });

      listeners.push(
        google.maps.event.addListener(ac, "place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          const loc = place.geometry.location;
          marker.setPosition(loc);
          map.panTo(loc);
          map.setZoom(16);
          if (place.formatted_address) {
            onChangeRef.current(place.formatted_address);
          } else {
            setFromLatLng(loc);
          }
        })
      );
    };

    const wait = setInterval(() => {
      if (window.google?.maps?.Map && window.google?.maps?.places) {
        clearInterval(wait);
        init();
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(wait);
      listeners.forEach((l) => l.remove());
    };
  }, [mapsKey]);

  if (!mapsKey) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map picker"
        />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Add <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">.env.local</code> to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input
        ref={searchEl}
        type="text"
        placeholder="Search for a place…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        autoComplete="off"
      />
      <div ref={mapEl} className="h-52 w-full rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" />
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
          Search, tap the map, or drag the pin — then edit the address text if needed.
        </p>
      </div>
    </div>
  );
}
