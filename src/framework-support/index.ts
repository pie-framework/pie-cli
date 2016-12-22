import * as _ from 'lodash';
import { buildLogger } from '../log-factory';
import * as resolve from 'resolve';
import { mkFromPath } from './support-module';
import { LoaderInfo, SupportInfo, ResolveFn } from './support-info';

import react from './frameworks/react';
import less from './frameworks/less';
import { support as legacySupport } from './frameworks/corespring-legacy';
export { react, less, legacySupport };

let logger = buildLogger();

export interface SupportConfig {
  npmDependencies: { [key: string]: string };
  externals: { js: string[], css: string[] };
  webpackLoaders(resolve: ResolveFn): LoaderInfo[];
}

export class BuildConfig implements SupportConfig {

  constructor(private modules: SupportInfo[]) {
    logger.debug('[BuildConfig:constructor]', modules);
  }

  get npmDependencies(): { [key: string]: string } {
    return _.reduce(this.modules, (acc, c) => {
      return _.extend(acc, c.npmDependencies);
    }, {});
  }

  get externals(): { js: string[], css: string[] } {
    return _.reduce(this.modules, (acc, m) => {
      let externals = _.merge({ js: [], css: [] }, m.externals);
      acc.js = _(externals.js).concat(acc.js).compact().sort().value();
      acc.css = _(externals.css).concat(acc.css).compact().sort().value();
      return acc;
    }, { js: [], css: [] });
  }

  webpackLoaders(resolve: ResolveFn): LoaderInfo[] {
    return _.reduce(this.modules, (acc, c) => {
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

}