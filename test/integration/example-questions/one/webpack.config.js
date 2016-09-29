const path = require('path');
const fs = require('fs');

const out = {
  "context": ".",
  "entry": "./entry.js",
  "output": {
    "filename": "bundle.js",
    "path": "."
  },
  "module": {
    "loaders": [
      {
        "test": /.(js|jsx)?$/,
        "loader": "babel-loader",
        "query": {
           "presets": [
              require.resolve('babel-preset-es2015'),
              require.resolve('babel-preset-react')
           ]
        },
        exclude: [
          /node_modules\/(?!(pie-player|hello-world)\/).*/
        ]
      },
      {
        "test": /\.less$/,
        "loader": "style!css!less",
      }
    ]
  },
  resolveLoader: {
    root: path.resolve(path.join(__dirname, 'node_modules'))
  },
  "resolve": {
    "extensions": [
      "",
      ".js",
      ".jsx"
    ]
  }
};
console.log('config: ', JSON.stringify(out, null, '  '));
module.exports = out; 