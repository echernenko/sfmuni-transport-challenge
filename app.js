;(() => {

    const mapTypes = ['neighborhoods', 'streets'];
    const mapScaleType = mapTypes[0];
    const vehiclesLayerCssClass = 'vehicles';
    const vehiclesLocationFetchURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni';
    const updateFrequencyMs = 3000;
    const renderWidth = 750;
    const renderHeight = 700;
    const routeSelectEl = document.getElementById('route');
    // geoJson to use for calibrating the svg
    let mapScaleGeoJson;
    // calculated once during first layer render
    let mapProjection, mapPath;
    // calculated once transport routes
    let transportRoutes = [];

    const svg = d3.select("svg")
        .attr('width', renderWidth)
        .attr('height', renderHeight);

    mapTypes.forEach((mapType) => {

        const getGeoMap = new Promise(function(resolve, reject) {
            let geoJson = JSON.parse(localStorage.getItem(mapType));
            if(geoJson) {
                resolve(geoJson);
            } else {
                 d3.json('geo/' + mapType + '.json').then((geoJson) => {
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
        });

    });

    // fetching vehicles locations
    // TODO: prevent long fetch ajax request race
    // condition
    setInterval(() => {
        d3.json(vehiclesLocationFetchURL + (routeSelectEl.value ? ('&r='+routeSelectEl.value) : '')).then((json) => {
            const vehiclesLayer = document.getElementsByClassName(vehiclesLayerCssClass)[0];
            if (vehiclesLayer) {
                vehiclesLayer.parentNode.removeChild(vehiclesLayer);
            }
            renderMapLayer (jsonToGeoJson(json), vehiclesLayerCssClass);
        });
    }, updateFrequencyMs);

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
