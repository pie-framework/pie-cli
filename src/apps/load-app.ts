import * as _ from 'lodash';

import { MultiConfig, SupportConfig, load as loadSupportModule } from '../framework-support';

import { App } from './types';
import CatalogApp from './catalog';
import DefaultApp from './default';
import InfoApp from './info';
import ItemApp from './item';
import { JsonConfig } from '../question/config';
import { buildWebpack } from '../code-gen';

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
  const less: SupportConfig = await loadSupportModule(config, 'pie-support-less');
  const react: SupportConfig = await loadSupportModule(config, 'pie-support-react');
  const corespringLegacy: SupportConfig = await loadSupportModule(config, 'pie-support-corespring-legacy');

  const support = _.compact([less, react, corespringLegacy]);
  return new MultiConfig(...support);
};

export function allApps(): any[] {
  return _.values(appMap);
};

export function loadApp(args: any): Promise<App> {
  const appKey = args.app || args.a || 'default';
  const clazz = appMap[appKey];
  const buildFn = buildWebpack.bind(null, args.logFile);
  return clazz.build(args, loadSupportConfig, buildFn);
};
