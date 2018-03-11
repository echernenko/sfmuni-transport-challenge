San Francisco Muni Transport Map
================================
Demo: http://sfmuni.echernenko.com/

Or copy the folder to any folder of exisiting website

Or go to the folder with project on your Mac and start webserver by executing
the next command:
`python -m SimpleHTTPServer 8000`

No backend is used.
Frontend is written in HTML, CSS and Javascript, that uses ES6 modules, Promises,
localstorage and some other features.

Assumptions:
I do not use bundler (like Webpack) for the sake of easy portability and literally
running code from any path, but with still preserving modern ES6 syntax. So please
run code in modern browser.

----------
Backlog:
- use this endpoint for fetching route names:
  http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni
- make different route buses different color; draw legend in sidebar; animate points moving from A to B;
- port FE to React (re-hydrate) - basically only routeTag selection control

- reflect routeTag in URL with history API (and thus save on refresh)?
- implement offline functionality (as it's possible to fetch predictions of the
  vehicles location at given time)
