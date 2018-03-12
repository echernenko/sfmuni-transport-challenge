San Francisco Muni Transport Map
================================
Demo: http://sfmuni.echernenko.com/

Or copy the folder to any folder of exisiting website

Or go to the folder with project on your Mac and start webserver by executing
the next command:
`python -m SimpleHTTPServer 8000`

No backend is used. No compiler required.
Frontend is written in HTML, CSS and Javascript, that uses ES6 modules, Promises,
localstorage and some other features. There is extensive usage of D3 and React
libs.

----------
Backlog:
- reflect routeTag in URL with history API (and thus save on refresh)?
- implement offline functionality (as it's possible to fetch predictions of the
  vehicles location at given time)
