import _ from 'lodash';
import { buildLogger } from '../log-factory';
import resolve from 'resolve';
import { join } from 'path';
let logger = buildLogger();

let es2015ModulesToCommonJsPlugin = resolve.sync('babel-plugin-transform-es2015-modules-commonjs', { basedir: join(__dirname, '../..') });

logger.debug('resolved plugin: ', es2015ModulesToCommonJsPlugin);

//add babel require hook
require('babel-register')({
  //don't ignore files in a `node_modules` dir
  plugins: [
    es2015ModulesToCommonJsPlugin
  ]
});


export class BuildConfig {

  constructor(modules) {
    logger.debug('[BuildConfig:constructor]', modules);
    this._modules = modules;
  }

  get npmDependencies() {
    return _.reduce(this._modules, (acc, c) => {
      return _.extend(acc, c.npmDependencies);
    }, {});
  }

  webpackLoaders(resolve) {
    return _.reduce(this._modules, (acc, c) => {
      return acc.concat(c.webpackLoaders(resolve));
    }, []);
  }
}

export default class FrameworkSupport {

  /**
   * @param frameworks - an array of objects that have a `support` function which returns {npmDependencies: , webpackLoaders: (resolve) => {}}
   */
  constructor(frameworks) {
    this.frameworks = frameworks;
  }

  buildConfigFromPieDependencies(dependencies) {

    let readSupport = (framework) => {
      if (!framework) {
        return;
      }

      //accomodate a possible `default` export.
      let o = framework.default ? framework.default : framework;

      if (_.isFunction(o)) {
        return o(dependencies);
      } else if (_.isFunction(o.support)) {
        return o.support(dependencies);
      } else if (_.isObject(o)) {
        return o;
      }
    }

    let rawModules = _(this.frameworks).map(readSupport).compact().value();
    return new BuildConfig(rawModules);
  }

  /**
   * @param _require - convert src at given path to an object (used for testing)
   */
  static bootstrap(modules, _require) {
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