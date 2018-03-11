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
  vehicleRoutesDescriptionFetchURL,
} from './config.js';
import {jsonToGeoJson} from './utils.js';
import {
  renderMapLayer,
  reflectVehicleRoutesInUI,
} from './ui.js';

const updateFrequencyMs = 15000;
// one time calculated vehicle routes
let vehicleRoutes = {};
const vehicleRoutesCacheKey = 'routes';
const mapData = {};
// used for increasing re-try time
let countFailedVehicleFetches = 0;
// re-try setTimeout id
let retrySetTimeout;
// svg scale is set
let mapScaleIsSet = false;

/**
 * Fetching all map layers + transportation on top
 */
export function fetchMapAllLayers() {
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
  const getGeoMap = new Promise((resolve, reject) => {
    const geoJsonCached = JSON.parse(localStorage.getItem(mapLayer));
    if (geoJsonCached) {
      resolve(geoJsonCached);
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
          reject();
          throw new Error(err);
        });
    }
  });

  // after we got a map from cache or by network
  // we save layer and pass for processing
  getGeoMap.then((geoJson) => {
    mapData[mapLayer] = geoJson;
    processMapLayersQueue();
  }).catch((err) => {
    // processing queue on failed request anyway
    processMapLayersQueue();
    throw new Error(err);
  });
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
  d3.json(vehiclesLocationFetchURL + (routeTag ? (`&r=${routeTag}`) : ''))
    .then((json) => {
      mapData[mapLayerVehicles] = jsonToGeoJson(json);
      processMapLayersQueue();
      // should we calculate / get from cache vehicle routes?
      const calculateRoutes = !Object.keys(vehicleRoutes).length;
      if (calculateRoutes) {
        fetchVehicleRoutes(json.vehicle);
      }
      // long-polling after last rendered result
      countFailedVehicleFetches = 0;
      retrySetTimeout = setTimeout(() => {
        fetchVehicles(routeTag);
      }, updateFrequencyMs);
    })
    .catch((err) => {
      // long-polling after last failed result
      countFailedVehicleFetches++;
      // increasing fetch wait time to prevent endpoint DDOS and banning
      retrySetTimeout = setTimeout(() => {
        fetchVehicles(routeTag);
      }, updateFrequencyMs * countFailedVehicleFetches);
      throw new Error(err);
    });
}

/**
 * Fetching vehicle routes information from public API
 * and live data feed and passing it to UI for rendering
 */
function fetchVehicleRoutes(jsonVehicleLocations) {
  // first trying cache
  const jsonCached = JSON.parse(localStorage.getItem(vehicleRoutesCacheKey));
  if (jsonCached) {
    vehicleRoutes = jsonCached;
    reflectVehicleRoutesInUI(vehicleRoutes)
    return;
  }
  // if routes are not cached - filling vehicle route keys at least
  jsonVehicleLocations.forEach((vehicle) => {
    vehicleRoutes[vehicle.routeTag] = 1;
  });
  // trying to get detailed route descriptions too
  // (but fail is not critical)
  d3.json(vehicleRoutesDescriptionFetchURL)
  .then((json) => {
    json.route.forEach((route) => {
      // processing route tags only from live data feed (or cached)
      if (!vehicleRoutes[route.tag]) { return; }
      // extending data by adding title
      vehicleRoutes[route.tag] = route.title;
    });
    localStorage.setItem(vehicleRoutesCacheKey, JSON.stringify(vehicleRoutes));
    // passing control over the data to UI
    reflectVehicleRoutesInUI(vehicleRoutes);
  })
  .catch((err) => {
    reflectVehicleRoutesInUI(vehicleRoutes);
    // failed fetch is totally ok as we will show in UI then only route tags
    // from main feed. No point caching this partial data though
    throw new Error(err);
  });
}

/**
 * Facilitates passing of loaded simultaneously map layers data into UI
 */
function processMapLayersQueue() {
  const layers = Object.keys(mapData);
  const layersLength = layers.length;
  // no layers - exiting
  if (!layersLength) { return; }
  // scale is not set and missing in queue
  if (!mapScaleIsSet && layers.indexOf(mapLayerScale) === -1) { return; }

  // if scale is set - we do not care about order any more
  if (mapScaleIsSet) {
    // rendering everything
    layers.forEach((layer) => {
      renderMapLayer(mapData[layer], layer);
      delete mapData[layer];
    });
  } else {
    // rendering main scaling layer
    // (defined in the config.js - neighborhoods.json)
    renderMapLayer(mapData[mapLayerScale], mapLayerScale);
    delete mapData[mapLayerScale];
    mapScaleIsSet = true;
  }
}
