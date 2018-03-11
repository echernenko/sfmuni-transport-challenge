/**
 * Application main entry point
 * Everything starts from loading map layers from provided SF .json files.
 * After loading some layers (configurable) - we load vehicle locations and
 * update every 15 seconds
 */

import { fetchMapAllLayers } from './transport.js';

// initialization
fetchMapAllLayers();
