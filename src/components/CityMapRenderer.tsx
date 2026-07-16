"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import chinaData from "@/data/china.json";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { themeRgb } from "@/lib/theme-color";

type CityPoint = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

function createCityTooltip(city: CityPoint, countLabel: string) {
  const wrapper = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = city.city;
  wrapper.append(name, document.createElement("br"), countLabel.replace("{count}", String(city.count)));
  return wrapper;
}

export default function CityMapRenderer({ cities }: { cities: CityPoint[] }) {
  const { theme, t } = useThemeAndLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const outlineRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([35, 105], 4);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      outlineRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const maxCount = cities.reduce((maximum, city) => Math.max(maximum, city.count), 1);
    const mapFill = themeRgb("--map-fill-rgb", 0.8);
    map.getContainer().style.background = themeRgb("--map-bg-rgb");
    outlineRef.current?.removeFrom(map);
    markersRef.current?.removeFrom(map);

    outlineRef.current = L.geoJSON(chinaData as GeoJSON.GeoJsonObject, {
      style: {
        color: themeRgb("--map-stroke-rgb", 0.4),
        weight: 0.8,
        opacity: 0.4,
        fillColor: mapFill,
        fillOpacity: 0.8,
      },
      onEachFeature: (_feature, layer) => {
        const path = layer as L.Path;
        layer.on({
          mouseover: () => path.setStyle({ fillColor: themeRgb("--brand-rgb", 0.45) }),
          mouseout: () => path.setStyle({ fillColor: mapFill }),
        });
      },
    }).addTo(map);

    markersRef.current = L.layerGroup(
      cities.map((city) => {
        const radius = maxCount <= 1 ? 14 : 8 + (city.count / maxCount) * 26;
        const fillOpacity = maxCount <= 1 ? 0.8 : 0.4 + (city.count / maxCount) * 0.5;
        return L.circleMarker([city.lat, city.lng], {
          radius,
          color: themeRgb("--brand-rgb"),
          fillColor: themeRgb("--brand-rgb"),
          fillOpacity,
          weight: 1.5,
          opacity: 0.8,
          className: "leaflet-neon-marker",
        }).bindTooltip(createCityTooltip(city, t("alumniMap.alumniCount")), { direction: "top", offset: [0, -10] });
      }),
    ).addTo(map);

    map.invalidateSize();
  }, [cities, theme, t]);

  return <div ref={containerRef} className="h-[360px] w-full md:h-96" />;
}
