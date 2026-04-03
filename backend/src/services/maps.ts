export type LatLng = { lat: number; lng: number };

export function estimateDistanceMeters(_from: LatLng, _to: LatLng): number {
  // TODO: Use Google Maps Distance Matrix or simple Haversine as fallback
  return 1000;
}

export function estimateEtaMinutes(distanceMeters: number): number {
  const avgSpeedMps = 3.0; // ~10.8 km/h cycling
  return Math.ceil(distanceMeters / (avgSpeedMps * 60));
}


