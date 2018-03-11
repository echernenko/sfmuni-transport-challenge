import {setMapScaleGeoJson, renderMapLayer} from './ui.js';
import {fetchAllMaps} from './transport.js';

// TODO: move detection to BE, when available
const mapTypes = ['neighborhoods', 'arteries', 'freeways', 'streets'];
// after loading/failing map below it's good to show vehicles
// (for example showing transport after loading only
//  "neighborhoods" is too early or waiting for "streets" to load
//  is too late and not needed)
const mapTriggerToFetchVehicles = mapTypes[2];

// application initialization
fetchAllMaps(mapTypes, mapTriggerToFetchVehicles);
