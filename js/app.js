import {setMapScaleGeoJson, renderMapLayer} from './ui.js';
import {fetchVehicles} from './transport.js';

// TODO: move detection to BE, when available
const mapTypes = ['neighborhoods','arteries','freeways','streets'];
// primary map, that is used for scaling of all objects
const mapScaleType = mapTypes[0];
// after loading map below - it's okay to show vehicles
const mapLastRequiredByVehicles = mapTypes[2];
// svg scale is set
let mapScaleIsSet = false;

mapTypes.forEach((mapType) => {

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
        if (mapType === mapScaleType) {
            setMapScaleGeoJson(geoJson);
            mapScaleIsSet = true;
        }
        renderMapLayer(geoJson, mapType);
        if (mapType === mapLastRequiredByVehicles) {
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

});
