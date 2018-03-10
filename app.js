;(() => {

    const mapTypes = ['neighborhoods','arteries','freeways','streets'];
    const mapScaleType = mapTypes[0];
    const mapVehiclesMandatory = mapTypes[2];
    const vehiclesLayerCssClass = 'vehicles';
    const vehiclesLocationFetchURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni';
    // TODO: change it to 15000 according to the spec
    const updateFrequencyMs = 10000;
    const renderWidth = 750;
    const renderHeight = 700;
    const routeSelectEl = document.getElementById('route');
    // geoJson to use for calibrating the svg
    let mapScaleGeoJson;
    // calculated once during first layer render
    let mapProjection, mapPath;
    // calculated once transport routes
    let transportRoutes = [];
    let countSuccessMapLayersRendered = 0;
    let countFailedVehicleFetches = 0;

    const svg = d3.select("svg")
        .attr('width', renderWidth)
        .attr('height', renderHeight);

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
                        // TODO: when having BE with the website
                        // calculate map sizes in advance
                        // TODO: implement main geometry chunks
                        // for initial load of the map and caching
                        if (mapType !== 'streets') {
                            localStorage.setItem(mapType, JSON.stringify(geoJson));
                        }
                        // holding map scale geoJson for calibrating
                        // the svg
                        if (mapType === mapScaleType) {
                            mapScaleGeoJson = geoJson;
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
            // holding map scale geoJson for calibrating
            // the svg
            if (mapType === mapScaleType) {
                mapScaleGeoJson = geoJson;
            }
            renderMapLayer(geoJson, mapType);
            if (mapType === mapVehiclesMandatory) {
                renderVehicles();
            }
        }).catch(() => {
            // we are rendering vehicles even if some
            // .json has failed.
            // Though we need at least one to succeed.
            // But never make hard dependency on large
            // streets.json (this is configurable)
            if (mapType === mapVehiclesMandatory && countSuccessMapLayersRendered) {
                renderVehicles();
            }
        });

    });

    /**
      * Fetching vehicle locations and rendering
      * them at the streets map
      */
    function renderVehicles() {
        d3.json(vehiclesLocationFetchURL + (routeSelectEl.value ? ('&r='+routeSelectEl.value) : ''))
            .then((json) => {
                const vehiclesLayer = document.getElementsByClassName(vehiclesLayerCssClass)[0];
                if (vehiclesLayer) {
                    vehiclesLayer.parentNode.removeChild(vehiclesLayer);
                }
                renderMapLayer (jsonToGeoJson(json), vehiclesLayerCssClass);
                // long-polling after last rendered result
                countFailedVehicleFetches = 0;
                setTimeout(renderVehicles, updateFrequencyMs);
            })
            .catch(() => {
                // long-polling after last failed result
                countFailedVehicleFetches++;
                // increasing fetch wait time to prevent endpoint DDOS and banning
                setTimeout(renderVehicles, updateFrequencyMs * countFailedVehicleFetches);
            })
    }

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

        const g = svg.append('g').attr('class', mapType);

        // appending a layer
        g.selectAll('path')
          .data(geoJson.features)
          .enter()
          .append('path')
          .attr('d', mapPath);

        // indicating, that layer is rendered
        // (at least one is required to show vehicle locations)
        countSuccessMapLayersRendered++;

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
            reflectTransportRoutesInUI();
        }
        return geoJson;
    }

    function reflectTransportRoutesInUI (routes) {
        Object.keys(transportRoutes).forEach(function (routeId) {
            const opt = document.createElement('option');
            opt.value = routeId;
            opt.innerHTML = routeId;
            routeSelectEl.appendChild(opt);
        });
        // TODO: trigger immediate UI change with selecting
        // a route in UI
    }

})();
