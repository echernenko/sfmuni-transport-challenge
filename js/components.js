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
    const { routes } = this.props;
    // defining first option
    const selectOptions = [React.createElement('option', { value: '', key: '1' }, 'all')];

    Object.keys(routes).forEach((routeId, index) => {
      // adding more options
      selectOptions.push(React.createElement(
        'option',
        { value: routeId, key: `${index+2}` },
        (routes[routeId] === 1) ? routeId : routes[routeId],
      ));
    });

    return React.createElement(
      'div',
      { className: 'route-selector' },
      React.createElement(
        'label',
        { htmlFor: 'route' },
        'Select a route to watch:',
      ),
      React.createElement(
        'select',
        { id: 'route', onChange: this.handleChange },
        selectOptions,
      ),
    );
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
    routeColors.forEach((cell, index) => {
      cells = cells.concat([
        React.createElement('td', { key: `cont-${index + 7}` }, null, React.createElement(
          'div',
          { className: 'color', key: index + 1, style: { background: `${cell.color}` } },
        )),
        React.createElement('td', null, `${cell.route}`),
      ]);
    });
    return React.createElement('tr', null, cells);
  }

  // rendering a component
  render() {
    const { routeColors } = this.props;
    const routes = Object.keys(routeColors);
    // defining legend rows
    const legendRows = [];
    // filling in legend rows
    while (routes.length) {
      const payload = [];
      const arrPortion = routes.splice(0, 3);
      arrPortion.forEach((el) => {
        payload.push({ route: el, color: routeColors[el] });
      });
      legendRows.push(this.createLegendRow(payload));
    }

    return React.createElement(
      'table', null,
      React.createElement(
        'thead', null,
        React.createElement(
          'tr', null,
          React.createElement('th', { key: 'cont-1' }, null, 'color'),
          React.createElement('th', { key: 'cont-2' }, null, 'route'),
          React.createElement('th', { key: 'cont-3' }, null, 'color'),
          React.createElement('th', { key: 'cont-4' }, null, 'route'),
          React.createElement('th', { key: 'cont-5' }, null, 'color'),
          React.createElement('th', { key: 'cont-6' }, null, 'route'),
        ),
      ),
      React.createElement('tbody', { id: 'colors-list' }, legendRows),
    );
  }
}
