'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type CityPoint = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

export default function CityMapRenderer({ cities }: { cities: CityPoint[] }) {
  const maxCount = cities.reduce((m, c) => Math.max(m, c.count), 1);

  const getRadius = (count: number) => {
    if (maxCount <= 1) return 14;
    return 8 + (count / maxCount) * 26;
  };

  const getOpacity = (count: number) => {
    if (maxCount <= 1) return 0.8;
    return 0.4 + (count / maxCount) * 0.5;
  };

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[360px] w-full md:h-96"
      style={{ background: '#f8f9fa' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {cities.map((c) => (
        <CircleMarker
          key={c.city}
          center={[c.lat, c.lng]}
          radius={getRadius(c.count)}
          pathOptions={{
            color: '#7C3AED',
            fillColor: '#7C3AED',
            fillOpacity: getOpacity(c.count),
            weight: 2,
            opacity: 0.7,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <strong>{c.city}</strong>
            <br />
            {c.count} 位校友
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
