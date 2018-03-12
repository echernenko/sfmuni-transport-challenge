module.exports = {
  "extends": "airbnb",
  "env": {
    "browser": true
  },
  "globals": {
    "d3": true,
    "React": true,
    "ReactDOM": true,
  },
  "rules": {
    "import/extensions": [ 'always', {ignorePackages: true} ],
    "no-plusplus": 0,
    "no-use-before-define": 0,
  }
};
