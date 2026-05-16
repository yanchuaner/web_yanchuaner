'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons in bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type AlumniPoint = { name: string; graduationClass: string; city: string; lat: number; lng: number };

// Simple city → coords mapping for Chinese cities common in alumni data
function getCoords(city: string): { lat: number; lng: number } | null {
  const c = city.trim();
  const map: Record<string, [number, number]> = {
    '北京': [39.9, 116.4],
    '上海': [31.2, 121.5],
    '广州': [23.1, 113.3],
    '深圳': [22.5, 114.1],
    '杭州': [30.3, 120.2],
    '南京': [32.1, 118.8],
    '成都': [30.6, 104.1],
    '武汉': [30.6, 114.3],
    '西安': [34.3, 108.9],
    '重庆': [29.6, 106.5],
    '天津': [39.1, 117.2],
    '长沙': [28.2, 113.0],
    '合肥': [31.8, 117.2],
    '郑州': [34.8, 113.6],
    '济南': [36.7, 117.0],
    '青岛': [36.1, 120.4],
    '大连': [38.9, 121.6],
    '哈尔滨': [45.8, 126.5],
    '沈阳': [41.8, 123.4],
    '长春': [43.9, 125.3],
    '厦门': [24.5, 118.1],
    '苏州': [31.3, 120.6],
    '宁波': [29.9, 121.6],
    '兰州': [36.1, 103.8],
    '南昌': [28.7, 115.9],
    '昆明': [25.0, 102.7],
    '贵阳': [26.6, 106.7],
    '福州': [26.1, 119.3],
    '石家庄': [38.0, 114.5],
    '太原': [37.9, 112.5],
    '南宁': [22.8, 108.3],
    '海口': [20.0, 110.3],
    '呼和浩特': [40.8, 111.8],
    '拉萨': [29.7, 91.1],
    '乌鲁木齐': [43.8, 87.6],
    '银川': [38.5, 106.2],
    '西宁': [36.6, 101.8],
  };
  const match = map[c];
  return match ? { lat: match[0], lng: match[1] } : null;
}

export default function AlumniMap() {
  const [points, setPoints] = useState<AlumniPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alumni/map')
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.alumni || [])
          .map((a: any) => {
            const coords = getCoords(a.city);
            return coords ? { ...a, ...coords } : null;
          })
          .filter(Boolean) as AlumniPoint[];
        setPoints(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/50">
        <p className="text-sm text-slate-300">正在加载校友分布图...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/15 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
      <MapContainer
        center={[35, 105]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-80 w-full"
        style={{ background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-gray-500">{p.graduationClass} · {p.city}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="flex items-center gap-2 border-t border-cyan-300/10 bg-slate-900/80 px-4 py-3">
        <MapPin size={14} className="text-cyan-400" />
        <p className="text-xs text-slate-300">
          共 {points.length} 个校友分布点 · 拖动地图浏览
        </p>
      </div>
    </div>
  );
}
