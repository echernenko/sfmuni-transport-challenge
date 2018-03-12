/**
 * React UI components module
 * RouteSelector and MapLegend
 */

import { fetchVehicles } from './transport.js';

/**
 * Dropdown component, that is used to pick routes to watch
 */
export class RouteSelector extends React.Component {

  // selecting a vehicle route listener
  handleChange(event) {
    fetchVehicles(event.target.value);
  }

  // rendering a component
  render() {

    const routes = this.props.routes;
    // defining first option
    const selectOptions = [ React.createElement("option", { value: "" }, "all") ];

    Object.keys(routes).forEach((routeId) => {
      // adding more options
      selectOptions.push(React.createElement("option",
      { value: routeId, key: Math.random()},
      (routes[routeId] === 1) ? routeId : routes[routeId]));
    });

    return React.createElement(
      "div",
      { "className": "route-selector" },
      React.createElement(
        "label",
        { "htmlFor": "route" },
        "Select a route to watch:"
      ),
      React.createElement(
        "select",
        { id: "route", onChange: this.handleChange },
        selectOptions
      ));

  }
}

/**
 * Map Legend component to show legend to the vehicle map
 * (colors and route numbers)
 */
export class MapLegend extends React.Component {

  // helper to create table row
  createLegendRow(routeColors) {
    let cells = [];
    routeColors.forEach((cell) => {
      cells = cells.concat([
        React.createElement("td", null, React.createElement("div",
          { "className": "color", "style": {background: `${cell['color']}`} })),
        React.createElement("td", null, `${cell['route']}`)
      ]);
    });
    return React.createElement("tr", null, cells);
  }

  // rendering a component
  render() {

    const routeColors = this.props.routeColors;
    const routes = Object.keys(routeColors);
    // defining legend rows
    const legendRows = [];
    // filling in legend rows
    while (routes.length) {
      let payload = [];
      const arrPortion = routes.splice(0, 3);
      arrPortion.forEach((el) => {
        payload.push({'route': el, 'color': routeColors[el]});
      });
      legendRows.push(this.createLegendRow(payload));
    }

    return React.createElement("table", null,
      React.createElement("thead", null,
        React.createElement("tr", null,
          React.createElement("th", null, "color"),
          React.createElement("th", null, "route"),
          React.createElement("th", null, "color"),
          React.createElement("th", null, "route"),
          React.createElement("th", null, "color"),
          React.createElement("th", null, "route")
        )
      ),
      React.createElement("tbody", { id: "colors-list" }, legendRows)
    );

  }
}
