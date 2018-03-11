/**
  * UI module
  * Responsible for rendering map layers and responding to user interactions
  */

import {mapWidth, mapHeight, mapLayerVehicles} from './config.js';
import {fetchVehicles} from './transport.js';

const routeSelectEl = document.getElementById('route');
const svg = d3.select('svg')
    .attr('width', mapWidth)
    .attr('height', mapHeight);
const svgEl = svg.node();

// calculated once during scale layer render
let mapProjection, mapPath, mapScaleGeoJson;

/**
  * Common point for rendering a map layer
  */
function renderMapLayer (geoJson, mapLayer) {

    // calculating once svg map scale
    if (!mapScaleGeoJson) {
        mapScaleGeoJson = geoJson;
    }
    // calculating once mapProjection and mapPath
    if (!mapProjection) {
        mapProjection = d3.geoMercator().fitSize([mapWidth, mapHeight], mapScaleGeoJson);
    }
    if (!mapPath) {
        mapPath = d3.geoPath().projection(mapProjection);
    }

    // is vehicles layer rendered?
    // it should be always last one in svg
    const vehiclesLayer = document.querySelector(`.${mapLayerVehicles}`);

    // if it's vehicles layer "refresh" - deleting it and re-creating
    // TODO: make it somehow smarter?
    if (vehiclesLayer && mapLayer === mapLayerVehicles) {
        vehiclesLayer.parentNode.removeChild(vehiclesLayer);
    }

    // appending a layer
    const g = svg.append('g');
    // setting layer attributes and content
    g.attr('class', mapLayer)
      .selectAll('path')
      .data(geoJson.features)
      .enter()
      .append('path')
      .attr('d', mapPath);

    // making sure vehicles layer always goes last
    // when adding some other layer as last one
    if (vehiclesLayer && mapLayer !== mapLayerVehicles) {
        svgEl.removeChild(vehiclesLayer);
        svgEl.append(vehiclesLayer);
    }
}

/**
  * Rendering transport route options in dropdown of the page
  * TODO: move to React
  */
function reflectTransportRoutesInUI (routes) {
    Object.keys(routes).forEach(function (routeId) {
        const opt = document.createElement('option');
        opt.value = routeId;
        opt.innerHTML = routeId;
        routeSelectEl.appendChild(opt);
    });
    // triggerring immediate UI change with selecting a route in UI
    routeSelectEl.addEventListener('change', (event) => {
        fetchVehicles(event.target.value);
    });
}

export {renderMapLayer, reflectTransportRoutesInUI};
