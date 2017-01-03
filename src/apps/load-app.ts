import { App, DefaultApp, InfoApp } from './types';
import { JsonConfig } from '../question/config';
import { BuildConfig, react, less, legacySupport } from '../framework-support';
import * as _ from 'lodash';
import { info } from '../package-info';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

const appMap = {
  'default': DefaultApp,
  'info': InfoApp
}

export default async function loadApp(args: any): Promise<App> {

  /**
   * prepare support config using the Apps config object.
   */
  let loadSupportConfig = (config) => {
    let deps = _(config.dependencies)
      .map((value, key) => {
        return { key: key, value: value };
      })
      .map(kv => info(kv, 'dependencies', config.dir))
      .value();

    return Promise.all(deps)
      .then((results) => {
        logger.silly('dependencies: ', JSON.stringify(results, null, '  '));
        let merged = _.reduce(results, _.merge, {});
        logger.silly('merged: ', JSON.stringify(merged, null, '  '));
        let legacy = legacySupport(config);
        let supportInfo = [react, less];

        if (legacy) {
          supportInfo.push(legacy);
        }
        return new BuildConfig(supportInfo);
      });
  };

  let appKey = args.app || args.a || 'default';

  let clazz = appMap[appKey];
  return clazz.build(args, loadSupportConfig);
}