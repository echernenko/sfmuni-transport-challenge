/**
 * Application utilities
 */

import { vehicleRouteDrop } from './config.js';

/**
 * JSON to geoJSON converter
 * @param {json} json A json, that represents map
 */
export function jsonToGeoJson(json) {
  const geoJson = {
    type: 'FeatureCollection',
    features: [],
  };
  if (!json.vehicle) {
    return geoJson;
  }
  json.vehicle.forEach((vehicle) => {
    const routeTag = vehicle.routeTag;
    // no route tag - unpredictable vehicle - skipping
    if (!routeTag) { return; }
    // dropping some routes because of bad SF map
    if (routeTag === vehicleRouteDrop) { return; }
    geoJson.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [vehicle.lon, vehicle.lat],
      },
      properties: {
        id: vehicle.id,
        route: vehicle.routeTag,
      }
    });
  });
  return geoJson;
}

/**
 * Random color generator
 * (used for paining vehicles of specific routes)
 */
export function getRandomColor() {
  const letters = '0123456789ABCDEF'.split('');
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}
