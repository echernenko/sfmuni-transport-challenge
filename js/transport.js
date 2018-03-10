import {vehiclesLayerCssClass, routeSelectEl, renderMapLayer, reflectTransportRoutesInUI} from './ui.js';

const vehiclesLocationFetchURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni';
// TODO: change it to 15000 according to the spec
const updateFrequencyMs = 10000;
// calculated once transport routes
let transportRoutes = {};
// used for increasing re-try time
let countFailedVehicleFetches = 0;

/**
  * Fetching vehicle locations and rendering
  * them at the streets map
  */
export function fetchVehicles() {
    d3.json(vehiclesLocationFetchURL + (routeSelectEl.value ? ('&r='+routeSelectEl.value) : ''))
        .then((json) => {
            renderMapLayer (jsonToGeoJson(json), vehiclesLayerCssClass);
            // long-polling after last rendered result
            countFailedVehicleFetches = 0;
            setTimeout(fetchVehicles, updateFrequencyMs);
        })
        .catch((err) => {
            // dumping error in the console
            console.error(err);
            // long-polling after last failed result
            countFailedVehicleFetches++;
            // increasing fetch wait time to prevent endpoint DDOS and banning
            setTimeout(fetchVehicles, updateFrequencyMs * countFailedVehicleFetches);
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
