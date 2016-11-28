import * as _ from 'lodash';
import { buildLogger } from '../log-factory';
import * as resolve from 'resolve';
import { mkFromPath } from './support-module';
let logger = buildLogger();


export class BuildConfig {

  constructor(private modules) {
    logger.debug('[BuildConfig:constructor]', modules);
  }

  get externals(){
    return _.reduce(this._modules, (acc, c) => {
        if(c.externals){
          if(c.externals.js){
            acc.js = acc.js.concat(c.externals.js)
          }
          if(c.externals.css){
            acc.css = acc.css.concat(c.externals.css)
          }
        }
        return acc;
    }, {js:[], css:[]});
  }

  get npmDependencies() {
    return _.reduce(this.modules, (acc, c: any) => {
      return _.extend(acc, c.npmDependencies);
    }, {});
  }

  get externals(): { js: string[], css: string[] } {
    return _.reduce(this.modules, (acc, m: any) => {
      let externals = _.merge({ js: [], css: [] }, m.externals);
      acc.js = _(externals.js).concat(acc.js).compact().sort().value();
      acc.css = _(externals.css).concat(acc.css).compact().sort().value();
      return acc;
    }, { js: [], css: [] });
  }

  webpackLoaders(resolve) {
    return _.reduce(this.modules, (acc, c: any) => {
      let loadersFn = _.isFunction(c.webpackLoaders) ? c.webpackLoaders : () => [];
      return acc.concat(loadersFn(resolve));
    }, []);
  }
}

export default class FrameworkSupport {

  /**
   * @param frameworks - an array of objects that have a `support` function which returns {npmDependencies: , webpackLoaders: (resolve) => {}}
   */
  constructor(private frameworks) { }

  buildConfigFromPieDependencies(dependencies) {

    let readSupport = (framework) => {
      if (!framework) {
        return;
      }


      if (_.isFunction(framework)) {
        return framework(dependencies);
      } else if (_.isFunction(framework.support)) {
        return framework.support(dependencies);
      } else if (_.isObject(framework)) {
        return framework;
      }
    }

    let rawModules = _(this.frameworks).map(readSupport).compact().value();
    return new BuildConfig(rawModules);
  }

  /**
   * @param _require - convert src at given path to an object (used for testing)
   */
  static bootstrap(modules) {

    let loadModule = (f) => {
      logger.debug('f: ', f);
      let path = resolve.sync(f);
      logger.debug('path: ', path);
      return mkFromPath(path);
    };

    logger.silly(`modules`, modules);

    let loadedModules = _.map(modules, loadModule);

    logger.silly(`loadedModules`, loadedModules);

    return new FrameworkSupport(loadedModules);
  };

}