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

export const DEFAULTS = {
  configFile: 'config.json',
  dependenciesFile: 'dependencies.json',
  markupFile: 'index.html',
  exampleFile: 'example.html',
  buildExample: false,
  keepBuildAssets: false,
  pieJs: 'pie.js',
  controllersJs: 'controllers.js'
};

export function clean(root, opts){

  opts = _.extend({}, DEFAULTS, opts);

  logger.info('clean...', root);
  let npmDir = new NpmDir(root);
  return npmDir.clean()
      .then(() => elementBundle.clean(root, opts.pieJs)) 
      .then(() => controllerMap.clean(root, opts.controllersJs))
      .then(() => markupExample.clean(root, opts.exampleFile));
}

export function build(root, opts, frameworkSupport){
  logger.info('build...', root);

  opts = _.extend({}, DEFAULTS, opts);
  
  logger.silly('build:opts: ', opts);
  
  let npmDir = new NpmDir(root);
  let rawConfig = fs.readJsonSync(path.join(root, opts.configFile));
  let lookup = fs.readJsonSync(path.join(root, opts.dependenciesFile)) || {};
  let config = new Config(rawConfig, lookup);

  let npmDependencies = _.extend({}, config.npmDependencies, {
    'pie-player': 'PieLabs/pie-player',
    'pie-controller' : 'PieLabs/pie-controller',
    'babel-core' : '^6.0.0',
    'webpack' : '^2.1.0-beta',
    'babel-loader' : '^6.2.5',
    'babel-preset-es2015' : '^6.14.0',
    // 'babel-preset-react' : '^6.11.1'
  });

  // -> do the install then get the dependency tree

  let pieNames = _.keys(config.npmDependencies);

  let supportModules;

  /**
   * Add dependencies need to build any frameworks used in the package (ie: react,..)
   * @param tree - a map of depth-0 dependencies of the package - passed to frameworkSupport
   */
  let addFrameworkSupportDependencies = (tree) => {
    logger.silly('dependencyTree', JSON.stringify(tree));
    supportModules = frameworkSupport.load(tree);
    let additionalDependencies = supportModules.npmDependencies;
    logger.silly('additionalDependencies: ', additionalDependencies);
    return npmDir.installMoreDependencies(additionalDependencies, {save: true})
      .then(() => supportModules)
  };

  /**
   * Build the element bundle.
   * Include the pie-player and pie-controller packages.
   */
  let buildElementBundle = (supportModules) => {
      let pieController = {
        key: 'pie-controller',
        initSrc: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
      }
      
      logger.silly('now use supportModules to prep the webpack config: ', JSON.stringify(supportModules));
      let libs = _.flatten([pieController,'pie-player'].concat(pieNames));
      return elementBundle.build(root, libs, opts.pieJs, supportModules.webpackLoaders)
  };

  return npmDir.install(npmDependencies)
    .then(() => npmDir.ls())
    .then(addFrameworkSupportDependencies) 
    .then(buildElementBundle)
    .then(() => controllerMap.build(root, opts.configFile, opts.controllersJs)) 
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