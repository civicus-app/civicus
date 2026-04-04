import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import type { AdminDistrictMetric } from '../../types/policy.types';
import type { District } from '../../types/user.types';
import { getDistrictFeature } from '../../lib/districtGeometry';

interface DistrictGeoMapProps {
  districts: District[];
  metrics?: AdminDistrictMetric[];
  selectedDistrictIds?: string[];
  onToggleDistrict?: (districtId: string) => void;
  readOnly?: boolean;
  heightClassName?: string;
}

const BASE_CENTER: L.LatLngExpression = [69.67, 18.95];

const getFillColor = (metric?: AdminDistrictMetric) => {
  const total = metric?.participants || 0;
  if (total >= 30) return '#0f8f8a';
  if (total >= 15) return '#55a8a5';
  if (total >= 1) return '#9ad1cf';
  return '#d8e4ef';
};

const getBorderColor = (metric?: AdminDistrictMetric, isSelected?: boolean) => {
  if (isSelected) return '#1a365d';
  const total = metric?.participants || 0;
  if (total >= 30) return '#0a5a57';
  if (total >= 15) return '#2d6b68';
  if (total >= 1) return '#4a7c79';
  return '#6b7d95';
};

export default function DistrictGeoMap({
  districts,
  metrics = [],
  selectedDistrictIds = [],
  onToggleDistrict,
  readOnly = true,
  heightClassName = 'h-[420px]',
}: DistrictGeoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const metricsByDistrict = useMemo(
    () => new Map(metrics.map((metric) => [metric.district_id, metric])),
    [metrics]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      zoomAnimation: true,
      fadeAnimation: true,
    }).setView(BASE_CENTER, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      opacity: 0.8,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      layerRef.current?.clearLayers();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const featureLayers: L.Layer[] = [];

    districts.forEach((district) => {
      const feature = getDistrictFeature(district);
      if (!feature) return;

      const isSelected = selectedDistrictIds.includes(district.id);
      const metric = metricsByDistrict.get(district.id);

      const geoJsonLayer = L.geoJSON(feature as GeoJSON.GeoJsonObject, {
        style: {
          color: getBorderColor(metric, isSelected),
          weight: isSelected ? 4 : 2.5,
          opacity: 0.9,
          fillColor: isSelected ? '#3b79c9' : getFillColor(metric),
          fillOpacity: isSelected ? 0.6 : 0.8,
          dashArray: isSelected ? null : '1, 2',
        },
        onEachFeature: (_, layer) => {
          // Add hover effects
          layer.on('mouseover', function() {
            this.setStyle({
              weight: 4,
              color: '#1a365d',
              fillOpacity: 0.9,
            });
          });
          layer.on('mouseout', function() {
            this.setStyle({
              weight: isSelected ? 4 : 2.5,
              color: getBorderColor(metric, isSelected),
              fillOpacity: isSelected ? 0.6 : 0.8,
            });
          });

          const popupLines = [
            `<strong>${district.name}</strong>`,
            metric ? `Participants: ${metric.participants}` : null,
            metric ? `Views: ${metric.views}` : null,
            metric ? `Votes: ${metric.votes}` : null,
            metric ? `Feedback: ${metric.feedback}` : null,
            !readOnly ? 'Click to toggle district' : null,
          ].filter(Boolean);
          layer.bindTooltip(popupLines.join('<br />'));
          if (!readOnly && onToggleDistrict) {
            layer.on('click', () => onToggleDistrict(district.id));
          }
        },
      });

      geoJsonLayer.addTo(layerGroup);
      featureLayers.push(geoJsonLayer);
    });

    if (featureLayers.length > 0) {
      const bounds = L.featureGroup(featureLayers).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.12));
      }
    }
  }, [districts, metricsByDistrict, onToggleDistrict, readOnly, selectedDistrictIds]);

  return <div ref={containerRef} className={`overflow-hidden rounded-2xl border-2 border-[#e1e8f0] shadow-lg bg-white ${heightClassName}`} />;
}
