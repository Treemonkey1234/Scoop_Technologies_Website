// Mapbox configuration - bulletproof TypeScript
export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
}

export const mapboxConfig: MapboxConfig = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.default',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-74.006, 40.7128], // NYC default
  zoom: 10
};

export function getMapboxConfig(): MapboxConfig {
  return mapboxConfig;
}

export function validateMapboxToken(token: string): boolean {
  return token && token.startsWith('pk.');
}

export default mapboxConfig;