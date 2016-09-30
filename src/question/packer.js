import NpmDir from '../npm/npm-dir';
import Config from '../question/config';
import fs from 'fs-extra';
import path from 'path';
import * as elementBundle from '../code-gen/element-bundle';
import * as controllerMap from '../code-gen/controller-map';
import * as markupExample from '../code-gen/markup-example';
import _ from 'lodash';

import {fileLogger} from '../log-factory'; 

let logger = fileLogger(__filename);

export function clean(root){
  logger.info('clean...', root);
  let npmDir = new NpmDir(root);
  return npmDir.clean()
      .then(() => elementBundle.clean(root)) 
      .then(() => controllerMap.clean(root))
      .then(() => markupExample.clean(root, 'example.html'));
}

export let defaults = {
  configFile: 'config.json',
  dependenciesFile: 'dependencies.json',
  markupFile: 'index.html',
  exampleFile: 'example.html',
  buildExample: false,
  keepBuildAssets: false
};

export function build(root, opts){
  logger.info('build...', root);

  opts = _.extend({}, defaults, opts);
  
  logger.silly('build:opts: ', opts);
  
  let npmDir = new NpmDir(root);
  let rawConfig = fs.readJsonSync(path.join(root, opts.configFile));
  let lookup = fs.readJsonSync(path.join(root, opts.dependenciesFile)) || {};
  let config = new Config(rawConfig, lookup);

  let npmDependencies = _.extend({}, config.npmDependencies, {
    'pie-player': 'PieLabs/pie-player',
    'pie-client-side-controller' : 'PieLabs/pie-client-side-controller',
    'babel-loader' : '^6.2.5',
    'babel-preset-es2015' : '^6.14.0',
    'babel-preset-react' : '^6.11.1'
  });
  
  let pieNames = _.keys(config.npmDependencies);

  return npmDir.install(npmDependencies)
    .then(() => {

      let pieClientSideController = {
        key: 'pie-client-side-controller',
        initSrc: `
        import ClientSideController from 'pie-client-side-controller';
        window.pie = window.pie || {};
        window.pie.ClientSideController = ClientSideController;`
      }

      let libs = _.flatten([pieClientSideController,'pie-player'].concat(pieNames));
      return elementBundle.build(root, libs)
    })
    .then(() => controllerMap.build(root, opts.configFile)) 
    .then(() => {
      if(!opts.keepBuildAssets){
        return npmDir.clean()
          .then(() => elementBundle.cleanBuildAssets(root));
      } else {
        return Promise.resolve();
      }
    }) 
    .then(() => { 
      if(opts.buildExample){
        return markupExample.build(root, opts.markupFile, opts.exampleFile, opts.configFile);
      } else {
        return Promise.resolve('');
      }
    })
    .then(() => logger.debug('packing completed'));
}