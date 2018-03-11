/**
 * Transport module
 * It is responsible for fetch of the map layers and vehicle locations on the
 * map. Passes information to ui.js module for rendering and is feeded by some
 * configuration from config.js. Implements localStorage caching if available.
 */

import {
  mapLayers,
  mapLayerVehicles,
  mapLayerScale,
  vehiclesLocationFetchURL,
  vehicleRouteDrop,
} from './config.js';
import {
  renderMapLayer,
  reflectTransportRoutesInUI,
} from './ui.js';

const updateFrequencyMs = 15000;
// one time calculated transport routes
const transportRoutes = {};
const mapsData = {};
// used for increasing re-try time
let countFailedVehicleFetches = 0;
// re-try setTimeout id
let retrySetTimeout;
// svg scale is set
let mapScaleIsSet = false;

/**
 * Fetching all map layers + transportation on top
 */
export function fetchAllMaps() {
  mapLayers.forEach((mapLayer) => {
    fetchMapLayer(mapLayer);
  });
}

/**
 * Fetching map layer
 * Trying first to get map layer from localstorage, if failed - via ajax call
 * @param {string} mapLayer A map layer name
 */
function fetchMapLayer(mapLayer) {
  // if it's vehicles layer - separate pipeline
  if (mapLayer === mapLayerVehicles) {
    fetchVehicles();
    return;
  }

  // regular pipeline
  const getGeoMap = new Promise(((resolve, reject) => {
    const geoJson = JSON.parse(localStorage.getItem(mapLayer));
    if (geoJson) {
      resolve(geoJson);
    } else {
      d3.json(`res/${mapLayer}.json`)
        .then((geoJson) => {
          // Caching every map except for "streets". It is too big for
          // caching (~10MB).
          // TODO: When having BE - calculate map sizes in advance and
          // avoid manual discarding of streets.json
          // TODO: implement main geometry chunks detection for initial
          // load of the map and caching friendly size
          if (mapLayer !== 'streets') {
            localStorage.setItem(mapLayer, JSON.stringify(geoJson));
          }
          resolve(geoJson);
        })
      // processing failure in json request
        .catch((err) => {
          throw new Error(err);
          reject(geoJson);
        });
    }
  }));

    // after we got a map from cache or by network
    // we save layer and pass for processing
  getGeoMap.then((geoJson) => {
    mapsData[mapLayer] = geoJson;
    processMapLayersQueue();
  }).catch((err) => {
    throw new Error(err);
    // processing queue on failed request anyway
    processMapLayersQueue();
  });
}

/**
 * Facilitates passing of loaded simultaneously map layers data into UI
 */
function processMapLayersQueue() {
  const layers = Object.keys(mapsData);
  const layersLength = layers.length;
  if (!layersLength) {
    return;
  }
  // map scale must be set first
  if (mapScaleIsSet) {
    // if scale is set - we do not care about order any more
    for (const layer of layers) {
      renderMapLayer(mapsData[layer], layer);
      delete mapsData[layer];
    }
  } else {
    // however if scale is not set - we try to set it or it will be triggered
    // next function call
    if (layers.indexOf(mapLayerScale) !== -1) {
      // ok, we have data for scaling svg
      renderMapLayer(mapsData[mapLayerScale], mapLayerScale);
      delete mapsData[mapLayerScale];
      mapScaleIsSet = true;
      // and let's process all pending map layers into the UI
    }
  }
}

/**
 * Fetching vehicle locations and rendering
 * them at the streets map
 * @param {string} routeTag A vehicle route tag (code)
 */
export function fetchVehicles(routeTag) {
  // in case someone interacted with UI
  // otherwise - no harm
  if (retrySetTimeout) {
    clearTimeout(retrySetTimeout);
  }
  // TODO: fix looking into UI by saving state
  d3.json(vehiclesLocationFetchURL + (routeTag ? (`&r=${routeTag}`) : ''))
    .then((json) => {
      mapsData[mapLayerVehicles] = jsonToGeoJson(json);
      processMapLayersQueue();
      // long-polling after last rendered result
      countFailedVehicleFetches = 0;
      retrySetTimeout = setTimeout(() => {
        fetchVehicles(routeTag);
      }, updateFrequencyMs);
    })
    .catch((err) => {
      throw new Error(err);
      // long-polling after last failed result
      countFailedVehicleFetches++;
      // increasing fetch wait time to prevent endpoint DDOS and banning
      retrySetTimeout = setTimeout(() => {
        fetchVehicles(routeTag);
      }, updateFrequencyMs * countFailedVehicleFetches);
    });
}

/**
 * JSON to geoJSON converter
 * @param {json} json A json, that represents map
 */
function jsonToGeoJson(json) {
  const geoJson = {
    type: 'FeatureCollection',
    features: [],
  };
  const calculateRoutes = !Object.keys(transportRoutes).length;
  json.vehicle.forEach((vehicle) => {
    // dropping some routes because of bad SF map
    if (vehicle.routeTag === vehicleRouteDrop) {
      return;
    }
    geoJson.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [vehicle.lon, vehicle.lat],
      },
    });
    if (calculateRoutes) {
      transportRoutes[vehicle.routeTag] = 1;
    }
  });
  // updating UI control once to show routes filter
  if (calculateRoutes) {
    reflectTransportRoutesInUI(transportRoutes);
  }
  return geoJson;
}
