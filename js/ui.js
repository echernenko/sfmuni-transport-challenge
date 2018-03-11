/**
 * UI module
 * Responsible for rendering map layers and responding to user interactions
 */

import { mapWidth, mapHeight, mapLayerVehicles } from './config.js';
import { fetchVehicles } from './transport.js';
import { getRandomColor } from './utils.js';

// calculated once during scale layer render
let mapProjection;
let mapPath;
let mapScaleGeoJson;

const routeSelectEl = document.getElementById('route');
const routeCssClassPrefix = 'route-';
const svg = d3.select('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);
const svgEl = svg.node();

/**
 * Common point for rendering a map layer
 * @param {json} geoJson A json, that represents map layer
 * @param {string} mapLayer A map layer name
 */
function renderMapLayer(geoJson, mapLayer) {
  // calculating once svg map scale
  if (!mapScaleGeoJson) {
    mapScaleGeoJson = geoJson;
  }
  // calculating once mapProjection
  if (!mapProjection) {
    mapProjection = d3.geoMercator().fitSize([mapWidth, mapHeight], mapScaleGeoJson);
  }
  // calculating once mapPath
  if (!mapPath) {
    mapPath = d3.geoPath().projection(mapProjection);
  }

  // user can select fast many routes - we do not want to render outdated one,
  // that landed after slow fetch request
  // TODO: think about streamlining transport layer to fix it properly
  if (mapLayer === mapLayerVehicles && routeSelectEl.value !== '') {
    // looking on the route tag in the first object
    const incorrectRouteArrived = (routeSelectEl.value !== geoJson.features[0].properties.route);
    // if mismatch with UI select - exiting
    if (incorrectRouteArrived) { return; }
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
    .attr('d', mapPath)
    .attr('class', function(d){
      if (mapLayer !== mapLayerVehicles) {
        return '';
      }
      // for vehicles layer we put customized css class to mark routes
      return `${routeCssClassPrefix}${d.properties.route.toLowerCase()}`;
    });

  // making sure vehicles layer always goes last
  // when adding some other layer as last one
  if (vehiclesLayer && mapLayer !== mapLayerVehicles) {
    svgEl.removeChild(vehiclesLayer);
    svgEl.append(vehiclesLayer);
  }
}

/**
 * Rendering vehicle route types in dropdown of the page
 * TODO: move to React
 * @param {array} routes A list of vehicle routes
 */
function reflectVehicleRoutesInUI(routes) {
  Object.keys(routes).forEach((routeId) => {
    const opt = document.createElement('option');
    opt.value = routeId;
    opt.innerHTML = (routes[routeId] === 1) ? routeId : routes[routeId];
    routeSelectEl.appendChild(opt);
  });
  // triggerring immediate UI change with selecting a route in UI
  routeSelectEl.addEventListener('change', (event) => {
    fetchVehicles(event.target.value);
  });
  // adding <style> tag with randomly generated colors for vehicles
  addRouteColorsToCss(routes);
}

function addRouteColorsToCss(routes) {
  let routesCssColors = '';
  Object.keys(routes).forEach((routeId) => {
    routesCssColors += `.vehicles .${routeCssClassPrefix}${routeId.toLowerCase()} { fill: ${getRandomColor()}; } `;
  });
  const style = document.createElement('style');
  style.innerHTML = routesCssColors;
  document.body.appendChild(style);
}

export { renderMapLayer, reflectVehicleRoutesInUI };
