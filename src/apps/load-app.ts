import * as _ from 'lodash';

import { MultiConfig, SupportConfig, load as loadSupportModule } from '../framework-support';

import { App } from './types';
import CatalogApp from './catalog';
import DefaultApp from './default';
import InfoApp from './info';
import ItemApp from './item';
import { JsonConfig } from '../question/config';
import { join } from 'path';

const appMap = {
  catalog: CatalogApp,
  default: DefaultApp,
  info: InfoApp,
  item: ItemApp
};

/**
 * prepare support config using the Apps config object.
 */
export async function loadSupportConfig(config: JsonConfig): Promise<SupportConfig> {
  const dir = (p) => join(__dirname, `../../support/${p}`);
  const base: SupportConfig = await loadSupportModule(config, dir('base'));
  const less: SupportConfig = await loadSupportModule(config, dir('less'));
  const react: SupportConfig = await loadSupportModule(config, dir('react'));
  const corespringLegacy: SupportConfig = await loadSupportModule(config, dir('corespring-legacy'));

  const support = _.compact([base, less, react, corespringLegacy]);
  return new MultiConfig(...support);
};

export function allApps(): any[] {
  return _.values(appMap);
};

export function loadApp(args: any): Promise<App> {
  const appKey = args.app || args.a || 'default';
  const clazz = appMap[appKey];
  return clazz.build(args, loadSupportConfig);
};
