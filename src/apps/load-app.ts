import { App, DefaultApp, InfoApp, CatalogApp } from './types';
import { BuildConfig, react, less, legacySupport } from '../framework-support';
import * as _ from 'lodash';
import { buildLogger } from '../log-factory';
import { JsonConfig } from '../question/config'

const logger = buildLogger();

const appMap = {
  'default': DefaultApp,
  'info': InfoApp,
  'catalog': CatalogApp
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
