import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import {fileLogger} from '../log-factory';

let logger = fileLogger(__filename);

class SupportConfig{

  constructor(supported){
    this._supported = supported;
  }

  get npmDependencies() {
    return _.reduce(this._supported, (acc,c) => {
      return _.extend(acc, c.npmDependencies);
    }, {});
  }

  webpackLoaders(resolve) {
    return _.reduce(this._supported, (acc, c) => {
      return acc.concat(c.webpackLoaders(resolve));
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
   * @param pathToObject - convert src at given path to an object
   */
  static bootstrap(dirs, pathToObject){


    let isJsFile = (dir, f) => {
      return fs.lstatSync(path.join(dir,f)).isFile() && 
        path.extname(f) === '.js'
    }

    let loadModule = (dir, f) => {
      try {
        let supportModule = pathToObject(path.join(dir, f));
        if(_.isFunction(supportModule.support)){
          return supportModule;
        } 
      } catch(e){
        this._logger.error(e);
      }
    };

    logger.silly(`dirs`, dirs);

    let supportModules = _(dirs).map((d) => {
      let files = _.filter(fs.readdirSync(d), (f) => isJsFile(d,f));
      logger.silly('files: ', files);
      let out = _(files).map( (f) => loadModule(d, f)).compact().value();
      logger.silly('out: ', out);
      return out;
    }).flatten().value();

    logger.silly(`supportModules:`, supportModules);

    return new FrameworkSupport(supportModules);
  };


  /**
   * @param dependencies a map of direct dependencies
   * @param resolve a method to load in the module (@see react.js)
   */
  load(dependencies, resolve){
    resolve = resolve || (() => {});

    let supportModules = _.reduce(dependencies, (acc, d, key) => {
      let s = _(this.frameworks).map((f) => f.support(key, d, resolve)).compact().value();
      //TODO: We are only supporting 1 framework match (last one wins) - could there be more than that?
      if(s && s.length === 1){
        acc[key] = s[0];
      }
      return acc;
    }, {});

    logger.debug('supportModules: ', supportModules);
    return new SupportConfig(supportModules);
  }
}