import * as _ from 'lodash';

import { App, CatalogApp, DefaultApp, InfoApp, ItemApp } from './types';
import { BuildConfig, legacySupport, less, react } from '../framework-support';

import { JsonConfig } from '../question/config'
import { buildLogger } from 'log-factory';

const logger = buildLogger();

const appMap = {
  'default': DefaultApp,
  'info': InfoApp,
  'catalog': CatalogApp,
  'item': ItemApp
}


export default async function loadApp(args: any): Promise<App> {

  /**
   * prepare support config using the Apps config object.
   */
  let loadSupportConfig = (config: JsonConfig) => {
    let legacy = legacySupport(config.dependencies, config.dir)
    let supportInfo = [react, less];

    if (legacy) {
      supportInfo.push(legacy);
    }
    let cfg = new BuildConfig(supportInfo);
    return Promise.resolve(cfg);
  };

  let appKey = args.app || args.a || 'default';

  let clazz = appMap[appKey];
  return clazz.build(args, loadSupportConfig);
}
