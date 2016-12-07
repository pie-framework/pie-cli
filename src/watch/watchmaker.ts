import { PackageWatch, PieWatch, FileWatch, Watch } from './watchers';
import { buildLogger } from '../log-factory';
import * as _ from 'lodash';
import { pathIsDir } from '../npm/dependency-helper';
import { join } from 'path';
import { JsonConfig } from '../question/config';
import { NotInstalledPackage, Element, LocalPackage, PiePackage, LocalFile } from '../question/config/elements';

const logger = buildLogger();

export function init(config: JsonConfig, reloadFn: (string) => void) {

  logger.debug('[init] questionConfig: ', config.elements);

  let watchers: Watch[] = _(config.elements).map((e: LocalFile | PiePackage | LocalPackage) => {
    if (e instanceof PiePackage) {
      return new PieWatch(e.key, e.value, config.dir);
    }

    if (e instanceof LocalFile) {
      return new FileWatch(join(config.dir, e.value), reloadFn);
    }

    if (e instanceof LocalPackage) {
      return new PackageWatch(e.key, e.value, config.dir);
    }
  }).compact().value();

  _.forEach(watchers, w => w.start());

  let configWatch = new FileWatch(
    join(config.dir, config.filenames.json), reloadFn);

  configWatch.start();

  let markupWatch = new FileWatch(
    join(config.dir, config.filenames.markup), reloadFn);

  markupWatch.start();

  return {
    dependencies: watchers,
    config: configWatch,
    markup: markupWatch
  }
}