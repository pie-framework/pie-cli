import fs from 'fs-extra';
import path from 'path';
import {fileLogger} from '../log-factory';
import Config from '../question/config';
import _ from 'lodash';

const babel = require('babel-core');
const logger = fileLogger(__filename);
const BUNDLE = 'controller-map-bundle.js';

function wrapModule(name, src){
  return `
root.pie.controllerMap['${name}'] = {};
(function(exports){
  ${src}
})(root.pie.controllerMap['${name}'])
`;
}

/**
 * Exports a controller map to: `window.pie.controllerMap`,
 * Where the map contains the logic for each pie. Each piece of logic is stored using the name of the pie.
 * eg: 
 * 
 * window.pie.controllerMap['my-pie'].model([], {}, {}).then(function(result){ console.log(result); });
 * 
 * //TODO: make this configurable?
 */
export default function buildControllerMap(root, jsonFile){
  let config = new Config(fs.readJsonSync(path.join(root, jsonFile)));
  logger.info('npmDependencies: ', config.npmDependencies);
  let moduleSrc = _(config.npmDependencies).keys().map((d) => {
    let controllerPath = path.join(root, 'node_modules', d, 'controller.js');
    let src = fs.readFileSync( controllerPath, {encoding: 'utf8'});
    let result = babel.transform(src, {presets: [require.resolve('babel-preset-es2015')]});
    return wrapModule(d, result.code);
  }).value().join('\n');


  let src = `
  (function(root){
    root.pie = root.pie || {};
    root.pie.controllerMap = root.pie.controllerMap || {};
    ${moduleSrc}
  })(this);
  `;

  let bundlePath = path.join(root, BUNDLE);
  fs.writeFileSync(bundlePath, src, {encoding: 'utf8'});
  return Promise.resolve({path: bundlePath, src: src});
}