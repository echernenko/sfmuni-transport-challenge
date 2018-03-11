import {vehiclesLayerCssClass, setMapScaleGeoJson, renderMapLayer, reflectTransportRoutesInUI} from './ui.js';

const vehiclesLocationFetchURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni';
// TODO: change it to 15000 according to the spec
const updateFrequencyMs = 10000;
// calculated only once transport routes
let transportRoutes = {};
// transport route below goes on north
// west and the road is not in .json
// TODO: find a good .json instead of hiding
const transportRouteDrop = '76X';
// used for increasing re-try time
let countFailedVehicleFetches = 0;
// re-try setTimeout
let retrySetTimeout;
// svg scale is set
let mapScaleIsSet = false;

/**
  * Fetching all map layers +
  * transportation on top
  */
export function fetchAllMaps(mapTypes, mapTriggerToFetchVehicles) {
    mapTypes.forEach((mapType) => {
        const loadVehicles = (mapType === mapTriggerToFetchVehicles) ? true : false;
        fetchMapLayer(mapType, loadVehicles);
    });
}

/**
  * Fetching map layer
  *
  * Trying first to get map layer from
  * localstorage, if failed - via ajax call
  */
function fetchMapLayer(mapType, loadVehicles = false) {

    const getGeoMap = new Promise(function(resolve, reject) {
        let geoJson = JSON.parse(localStorage.getItem(mapType));
        if(geoJson) {
            resolve(geoJson);
        } else {
             d3.json('geo/' + mapType + '.json')
                .then((geoJson) => {
                    // Caching every map except for "streets".
                    // It is too big for caching (~10MB)
                    // TODO: when having BE calculate map sizes in advance
                    // and avoid manual discarding of streets.json
                    // TODO: implement main geometry chunks detection
                    // for initial load of the map and caching friendly
                    // size
                    if (mapType !== 'streets') {
                        localStorage.setItem(mapType, JSON.stringify(geoJson));
                    }
                    resolve(geoJson);
                })
                // processing failure in json request
                .catch(() => {
                    reject(geoJson);
                });
        }
    });

    // after we got a map from cache or by network
    // we render it
    getGeoMap.then(function(geoJson) {
        // setting map scale of the svg
        if (!mapScaleIsSet) {
            setMapScaleGeoJson(geoJson);
            mapScaleIsSet = true;
        }
        renderMapLayer(geoJson, mapType);
        if (loadVehicles) {
            fetchVehicles();
        }
    }).catch((err) => {
        console.error(err);
        // we are rendering vehicles even if some
        // .json has failed
        // basically even one layer is enough
        if (mapScaleIsSet && mapType === mapLastRequiredByVehicles) {
            fetchVehicles();
        }
    });
}

/**
  * Fetching vehicle locations and rendering
  * them at the streets map
  */
export function fetchVehicles(routeTag) {
    // in case someone interacted with UI
    // otherwise - no harm
    if (retrySetTimeout) {
        clearTimeout(retrySetTimeout);
    }
    // TODO: fix looking into UI by saving state
    d3.json(vehiclesLocationFetchURL + (routeTag ? ('&r='+routeTag) : ''))
        .then((json) => {
            renderMapLayer (jsonToGeoJson(json), vehiclesLayerCssClass);
            // long-polling after last rendered result
            countFailedVehicleFetches = 0;
            retrySetTimeout = setTimeout(() => {
                fetchVehicles(routeTag);
            }, updateFrequencyMs);
        })
        .catch((err) => {
            // dumping error in the console
            console.error(err);
            // long-polling after last failed result
            countFailedVehicleFetches++;
            // increasing fetch wait time to prevent endpoint DDOS and banning
            retrySetTimeout = setTimeout(() => {
                fetchVehicles(routeTag)
            }, updateFrequencyMs * countFailedVehicleFetches);
        })
}

/**
  * JSON to geoJSON converter
  */
function jsonToGeoJson (json) {
    const geoJson = {
        "type": "FeatureCollection",
        "features": []
    };
    const calculateRoutes = Object.keys(transportRoutes).length ? false : true;
    json.vehicle.forEach((vehicle) => {
        geoJson.features.push({
            "type": "Feature",
            "geometry": {
                 "type": "Point",
                 "coordinates": [ vehicle.lon, vehicle.lat ]
             }
        });
        if (calculateRoutes && vehicle.routeTag !== transportRouteDrop) {
            transportRoutes[vehicle.routeTag] = 1;
        }
    });
    // updating UI control once to show routes filter
    if (calculateRoutes) {
        reflectTransportRoutesInUI(transportRoutes);
    }
    return geoJson;
}
