/**
 * Configuration options of the application
 */

const mapWidth = 750;
const mapHeight = 700;
const mapLayerVehicles = 'vehicles';
// available map types, when BE is available - detect by reading dir
// even though 'vehicles' is external - pipeline is the same as for local maps
const mapLayers = ['neighborhoods', 'arteries', 'freeways', mapLayerVehicles, 'streets'];
// map layer, that is used for scaling whole svg
const mapLayerScale = mapLayers[0];
// public API URL
const vehiclesLocationFetchURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni';
// route below is ignored due to poor map, fix it in future
const vehicleRouteDrop = '76X';

export {mapWidth, mapHeight, mapLayerVehicles, mapLayers, mapLayerScale, vehiclesLocationFetchURL, vehicleRouteDrop};
