import * as types from './types';

import { loadApp, loadSupportConfig } from './load-app';

import CatalogApp from './catalog';
import DefaultApp from './default';
import InfoApp from './info';
import ItemApp from './item';
import { clean } from './clean';

export {
  CatalogApp,
  clean,
  DefaultApp,
  InfoApp,
  ItemApp,
  loadApp,
  loadSupportConfig,
  types,
};
