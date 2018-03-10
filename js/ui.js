const routeSelectEl = document.getElementById('route');
const vehiclesLayerCssClass = 'vehicles';
const renderWidth = 750;
const renderHeight = 700;
const svg = d3.select('svg')
    .attr('width', renderWidth)
    .attr('height', renderHeight);
const svgEl = svg.node();

// calculated once during first layer render
let mapProjection, mapPath, mapScaleGeoJson;

/**
  * Common point for rendering
  * a map layer
  */
function renderMapLayer (geoJson, mapType) {

    // calculating once mapProjection and mapPath
    if (!mapProjection) {
        mapProjection = d3.geoMercator().fitSize([renderWidth, renderHeight], mapScaleGeoJson);
    }
    if (!mapPath) {
        mapPath = d3.geoPath().projection(mapProjection);
    }

    // is vehicles layer rendered?
    // it should be always last one in svg
    const vehiclesLayer = document.querySelector(`.${vehiclesLayerCssClass}`);

    // if it's vehicles layer refresh - deleting layer and re-creating
    // TODO: make it somehow smarter?
    if (vehiclesLayer && mapType === vehiclesLayerCssClass) {
        vehiclesLayer.parentNode.removeChild(vehiclesLayer);
    }

    // appending a layer
    const g = svg.append('g');

    // setting layer attributes and content
    g.attr('class', mapType)
      .selectAll('path')
      .data(geoJson.features)
      .enter()
      .append('path')
      .attr('d', mapPath);

    // making sure vehicles layer always goes last
    // when adding some other layer as last one
    if (vehiclesLayer && mapType !== vehiclesLayerCssClass) {
        svgEl.removeChild(vehiclesLayer);
        svgEl.append(vehiclesLayer);
    }
}

/**
  * Setting svg scale
  */
function setMapScaleGeoJson(geoJson) {
    mapScaleGeoJson = geoJson;
}

/**
  * Rendering transport route options
  * in dropdown of the page
  */
function reflectTransportRoutesInUI (routes) {
    Object.keys(routes).forEach(function (routeId) {
        const opt = document.createElement('option');
        opt.value = routeId;
        opt.innerHTML = routeId;
        routeSelectEl.appendChild(opt);
    });
    // TODO: trigger immediate UI change with selecting
    // a route in UI
}

export {routeSelectEl, vehiclesLayerCssClass, renderMapLayer, setMapScaleGeoJson, reflectTransportRoutesInUI};
