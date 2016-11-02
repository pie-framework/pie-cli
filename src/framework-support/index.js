import _ from 'lodash';
import { buildLogger } from '../log-factory';
import resolve from 'resolve';
import { join } from 'path';

//add babel require hook
require('babel-register')({
  plugins: [resolve.sync('babel-plugin-transform-es2015-modules-commonjs', { basedir: join(__dirname, '../..') })]
});


let logger = buildLogger();

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
    let rawModules = _(this.frameworks).map((f) => f.support(dependencies)).compact().value();
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