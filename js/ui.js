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
const vehicleCssIdPrefix = 'vehicle-';
const vehicleInvisibleCssSuffix = '-hidden';
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
    // looking on the route tag of the first object
    const incorrectRouteArrived = (routeSelectEl.value !== geoJson.features[0].properties.route);
    // if mismatch with UI select - exiting
    if (incorrectRouteArrived) { return; }
  }

  // is vehicles layer rendered?
  // it should be always last one in svg
  const vehiclesLayer = svg.select(`.${mapLayerVehicles}`).node();

  // processing vehicles layer update
  if (vehiclesLayer && mapLayer === mapLayerVehicles) {

    // first appending invisible layer to perform easy reading of target paths
    appendMapLayer(`${mapLayerVehicles}${vehicleInvisibleCssSuffix}`, geoJson, true);
    // getting paths of visible and invisible layers
    const vehiclesInvisibleEl = svg.select(`.${mapLayerVehicles}${vehicleInvisibleCssSuffix}`).node();
    const invisiblePaths = vehiclesInvisibleEl.children;
    const visiblePaths = vehiclesLayer.children;

    // second emoving vehicles, that are not present in invisible layer
    for (let path of visiblePaths) {
      const invisiblePathExists = svg.select(`.${mapLayerVehicles}${vehicleInvisibleCssSuffix} #${path.id}`).node();
      if (!invisiblePathExists) {
        vehiclesLayer.removeChild(path);
      }
    }

    // third - simply moving every point on visible layer to new coordinates
    // if visible layer does not have path - copying it from invisible
    for (let path of invisiblePaths) {
      let visiblePath = svg.select(`.${mapLayerVehicles} #${path.id}`);
      if (!visiblePath.node()) {
          vehiclesLayer.appendChild(path);
      } else {
        visiblePath
          .transition()
          .duration(500)
          .attr('d', path.getAttribute('d'));
      }
    }

    // destroying invisible layer
    svgEl.removeChild(vehiclesInvisibleEl);

    // no more work is required at this point
    return;
  }

  // appending a layer for the first time
  appendMapLayer(mapLayer, geoJson, (mapLayer === mapLayerVehicles ? true : false));

  // making sure vehicles layer always goes last
  if (vehiclesLayer && mapLayer !== mapLayerVehicles) {
    svgEl.removeChild(vehiclesLayer);
    svgEl.append(vehiclesLayer);
  }
}

/**
 * Appending map layer to the svg
 * @param {string} name A map layer namei
 * @param {json} json A data to render the layer
 * @param {boolean} renderAttributes Defining if id and class attr will be rendered
 */
function appendMapLayer(name, json, renderAttributes){
   // appending a layer
   const g = svg.append('g');
   // setting layer attributes and content
   g.attr('class', name)
     .selectAll('path')
     .data(json.features)
     .enter()
     .append('path')
     .attr('d', mapPath)
     .attr('class', function(d){
       if (!renderAttributes) {
         return null;
       }
       // for vehicles layer we put customized css class to mark routes
       return `${routeCssClassPrefix}${d.properties.route.toLowerCase()}`;
     })
     .attr('id', function(d){
       if (!renderAttributes) {
         return null;
       }
       return `${vehicleCssIdPrefix}${d.properties.id}`;
     });
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
    // also to avoid extra work with checking nodes - removing all redundant
    // vehicles from .vehicles layer
    if (event.target.value) {
      const redundantVehicles = document.querySelectorAll(`.vehicles path:not(.${routeCssClassPrefix}${event.target.value.toLowerCase()})`);
      const vehiclesLayerEl = d3.select('.vehicles').node();
      for (let vehicle of redundantVehicles) {
        vehiclesLayerEl.removeChild(vehicle);
      }
    }
  });
  // adding <style> tag with randomly generated colors for vehicles
  addRouteColorsToCss(routes);
}

/**
 * Adding vehicle route color styles
 * <style> el is added the DOM to reflect assigned to the vehicle routes colors
 * @param {array} routes A vehicle routes
 */
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
