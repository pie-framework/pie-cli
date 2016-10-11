import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import {fileLogger} from '../log-factory';
import resolve from 'resolve';

//add babel require hook
require('babel-register');

let logger = fileLogger(__filename);

export class BuildConfig{

  constructor(modules){
    logger.debug('[BuildConfig:constructor]', modules);
    this._modules = modules;
  }

  get npmDependencies() {
    return _.reduce(this._modules, (acc,c) => {
      logger.silly('config: ', JSON.stringify(c.config));
      return _.extend(acc, c.config.npmDependencies);
    }, {});
  }

  webpackLoaders(resolve) {
    return _.reduce(this._modules, (acc, c) => {
      return acc.concat(c.config.webpackLoaders(resolve));
    }, []); 
  }
}

export default class FrameworkSupport{

  /**
   * @param frameworks - an array of objects that have a `support` function which returns {npmDependencies: , webpackLoaders: (resolve) => {}}
   */
  constructor(frameworks){
    this.frameworks = frameworks;
  }


  /**
   * @return BuildConfig
   */
  buildConfigFromKeys(keys){

    let toModule  = (k) => {
      let config = _(this.frameworks).map((f) => f.support(k)).compact().head();
      logger.silly('key: ', k, ' config: ', config);
      return { 
        key: k, 
        config: config, 
        error: config ? null : new Error('No config for ' + k)
      };
    }

    let modules = _.map(keys, toModule);

    let errors = _.filter(modules, (m) => m.error);

    if(errors.length > 0){
      throw new Error('Missing config for: ' + _.map(errors, 'key'));
    }
    logger.debug('modules: ', modules);
    return new BuildConfig(modules);
  }

  /**
   * @param _require - convert src at given path to an object (used for testing)
   */
  static bootstrap(modules, _require){
    _require = _require || require;

    let loadModule = (f) => {
      logger.debug('f: ', f);
      let path = resolve.sync(f);
      logger.debug('path: ', path);
      return _require(path);
    };

    logger.silly(`modules`, modules);

    let loadedModules = _.map(modules, loadModule);
    
    logger.silly(`loadedModules`, loadedModules);

    return new FrameworkSupport(loadedModules);
  };

}