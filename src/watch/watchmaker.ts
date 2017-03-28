import * as _ from 'lodash';

import { Dirs, Mappings } from '../install';
import { FileWatch, PackageWatch, PieWatch, Watch } from './watchers';
import { LocalFile, LocalPackage, PiePackage } from '../question/config/elements';

import { JsonConfig } from '../question/config';
import { buildLogger } from 'log-factory';
import { join } from 'path';

const logger = buildLogger();


type ReloadFn = (n: string) => void;

export function init(
  config: JsonConfig,
  reloadFn: ReloadFn,
  extraFilesToWatch: string[],
  mappings: Mappings,
  dirs: Dirs): {
    dependencies: Watch[],
    files: FileWatch[]
  } {

  logger.debug('[init] questionConfig: ', config.elements);

  const watchers: Watch[] = _(config.elements).map((e: LocalFile | PiePackage | LocalPackage) => {

    if (e instanceof PiePackage) {
      logger.silly('create PieWatch', e.key, e.value);
      const targets = {
        configure: (mappings.configure.find(m => m.pie === e.key) || { target: null }).target,
        controller: (mappings.controllers.find(m => m.pie === e.key) || { target: null }).target
      };

      return new PieWatch(
        e.key,
        config.dir,
        e.value,
        dirs,
        targets);
    }

    if (e instanceof LocalFile) {
      logger.silly('create FileWatch', e.value);
      return new FileWatch(join(config.dir, e.value), reloadFn);
    }

    if (e instanceof LocalPackage) {
      logger.silly('create PackageWatch', e.key, e.value);
      return new PackageWatch(e.key, e.value, config.dir);
    }
  }).compact().value();

  logger.silly('watchers: ', watchers);

  _.forEach(watchers, (w) => w.start());

  const allFiles = [
    join(config.dir, config.filenames.json),
    join(config.dir, config.filenames.markup)
  ].concat(extraFilesToWatch || []);

  const fileWatches = allFiles.map((p) => {
    logger.silly(`FileWatch for ${p}`);
    const fw = new FileWatch(p, reloadFn);
    fw.start();
    return fw;
  });

  return {
    dependencies: watchers,
    files: fileWatches
  };
}
