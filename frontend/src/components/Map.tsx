'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: { maps: { Map: new (el: HTMLElement, opts: object) => object; Marker: new (opts: object) => object } };
  }
}

type Props = { center: { lat: number; lng: number }; zoom?: number };

export default function Map({ center, zoom = 15 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !window.google) return;
    const map = new window.google.maps.Map(ref.current, { center, zoom });
    new window.google.maps.Marker({ position: center, map });
  }, [center, zoom]);

  return <div ref={ref} className="h-64 w-full rounded border" />;
}


