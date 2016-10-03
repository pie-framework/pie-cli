import fs from 'fs-extra';
import path from 'path';
import {fileLogger} from '../log-factory';
import Config from '../question/config';
import _ from 'lodash';
import {removeFiles} from '../file-helper';

const babel = require('babel-core');
const logger = fileLogger(__filename);

function wrapModule(name, src){
  return `
root.pie.controllerMap['${name}'] = {};
(function(exports, require){
  ${src}
})(root.pie.controllerMap['${name}'], root.pie.require)
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
export function build(root, jsonFile, bundleName){
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

    var supportedLibraries = {
      lodash: _
    }

    /**
     * add support for require in modules
     */
    root.pie.require = function(name){
      if(supportedLibraries.hasOwnProperty(name)){
        if(!supportedLibraries[name]){
          throw new Error('This library is supported but maybe it has not been loaded? ' + name);
        } else {
          return supportedLibraries[name];
        }
      } else {
        throw new Error('This library is not supported: ' + name);
      }
    }

    root.pie.controllerMap = root.pie.controllerMap || {};
    ${moduleSrc}
  })(this);
  `;

  let bundlePath = path.join(root, bundleName);
  fs.writeFileSync(bundlePath, src, {encoding: 'utf8'});
  return Promise.resolve({path: bundlePath, src: src});
}

export function clean(root, bundleName){
  return removeFiles(root, [bundleName]);
}