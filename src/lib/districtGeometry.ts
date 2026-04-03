import type { District } from '../types/user.types';

type GeoJsonFeature = {
  type: 'Feature';
  properties: {
    districtId: string;
    name: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

const polygon = (districtId: string, name: string, coordinates: number[][]): GeoJsonFeature => ({
  type: 'Feature',
  properties: { districtId, name },
  geometry: {
    type: 'Polygon',
    coordinates: [[...coordinates, coordinates[0]]],
  },
});

export const DISTRICT_GEOJSON_BY_NAME: Record<string, GeoJsonFeature> = {
  Tromsoya: polygon('tromsoya', 'Tromsoya', [
    [18.91, 69.662],
    [18.97, 69.667],
    [18.995, 69.688],
    [18.984, 69.714],
    [18.942, 69.721],
    [18.905, 69.704],
    [18.898, 69.681],
  ]),
  Fastlandet: polygon('fastlandet', 'Fastlandet', [
    [19.02, 69.655],
    [19.12, 69.662],
    [19.182, 69.69],
    [19.165, 69.728],
    [19.076, 69.742],
    [19.018, 69.713],
  ]),
  Kvaloya: polygon('kvaloya', 'Kvaloya', [
    [18.62, 69.642],
    [18.77, 69.651],
    [18.842, 69.683],
    [18.815, 69.746],
    [18.702, 69.759],
    [18.598, 69.718],
  ]),
  Hakoya: polygon('hakoya', 'Hakoya', [
    [18.745, 69.665],
    [18.786, 69.67],
    [18.79, 69.689],
    [18.752, 69.694],
    [18.733, 69.679],
  ]),
};

export const getDistrictFeature = (district: Pick<District, 'id' | 'name' | 'geojson'>) => {
  if (district.geojson && typeof district.geojson === 'object') {
    return district.geojson as GeoJsonFeature;
  }
  return DISTRICT_GEOJSON_BY_NAME[district.name] || null;
};
